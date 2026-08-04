-- Create the global_settings table
CREATE TABLE IF NOT EXISTS public.global_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to select (read) settings
-- (Note: Since the backend uses the service_role client, it bypasses RLS,
-- but this policy is good practice for future frontend/public reads if needed).
CREATE POLICY "Allow public read access to global_settings" 
  ON public.global_settings 
  FOR SELECT 
  TO authenticated, anon 
  USING (true);

-- Insert initial values for the settings and limits
INSERT INTO public.global_settings (key, value, description) VALUES
  ('alpha_active', 'false', 'Enable or disable the alpha tier auto-assignment and access'),
  ('alpha_max_extractions_per_window', '10', 'Number of extractions alpha users can perform in the rolling window'),
  ('alpha_max_saved_recipes', '20', 'Max number of saved recipes alpha users can keep in their cookbook'),
  ('free_max_extractions_per_window', '3', 'Number of extractions free users can perform in the rolling window'),
  ('free_max_saved_recipes', '5', 'Max number of saved recipes free users can keep in their cookbook'),
  ('premium_max_extractions_per_window', '50', 'Number of extractions premium users can perform in the rolling window'),
  ('premium_max_saved_recipes', '-1', 'Max number of saved recipes premium users can keep in their cookbook (-1 for unlimited)'),
  ('max_video_duration_seconds', '90', 'Reject videos longer than this many seconds before downloading (0 disables the check)')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;

-- --- organizing features migration ---

-- Phase A: Add is_favorite to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Phase B: Add flags to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}';

-- Total downloaded media size (audio + video, bytes) per job. Powers the admin "Downloaded MB" metric.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS media_bytes bigint NOT NULL DEFAULT 0;

-- Phase B: Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phase B: Recipe Collections Join Table
CREATE TABLE IF NOT EXISTS public.recipe_collections (
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
  job_id text REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  PRIMARY KEY (collection_id, job_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS recipe_collections_user_id_idx ON public.recipe_collections(user_id);
CREATE INDEX IF NOT EXISTS recipe_collections_job_id_idx ON public.recipe_collections(job_id);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow users to select their own collections" ON public.collections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own collections" ON public.collections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own collections" ON public.collections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own collections" ON public.collections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to select their own recipe_collections" ON public.recipe_collections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own recipe_collections" ON public.recipe_collections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own recipe_collections" ON public.recipe_collections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own recipe_collections" ON public.recipe_collections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- feedback / bug reports migration ---

-- In-app bug reports & feedback submitted from the Settings/Profile tab.
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'bug', -- 'bug' | 'idea'
  message text NOT NULL,
  context jsonb,                    -- device/app context + recent console logs
  screenshot_urls text[],          -- signed URLs into the feedback-screenshots bucket
  created_at timestamptz DEFAULT now()
);

-- Migrate any earlier single-screenshot column to the array form.
ALTER TABLE public.feedback DROP COLUMN IF EXISTS screenshot_url;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS screenshot_urls text[];

CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);

-- Enable RLS. The backend writes via the service_role client (bypasses RLS);
-- these policies are defense-in-depth for any direct authenticated client access.
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to select their own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Private storage bucket for feedback screenshots (backend serves signed URLs).
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- --- duplicate-extraction fix ---

-- Backstop against two near-simultaneous /extract-recipe requests for the same
-- URL both passing the app-level "no active job yet" check and creating two
-- jobs. Only one non-terminal job per (user, normalized URL) is allowed.
CREATE UNIQUE INDEX IF NOT EXISTS jobs_active_user_url_idx
  ON public.jobs (user_id, url_normalized)
  WHERE status IN ('pending', 'scraping', 'processing');

-- --- persistent gemini logging ---

-- Persistent Gemini request & cost logging table for LLM metrics
CREATE TABLE IF NOT EXISTS public.gemini_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  request_type text NOT NULL,
  model text NOT NULL,
  duration_ms integer NOT NULL,
  success boolean NOT NULL,
  error_msg text,
  input_data jsonb,
  token_prompt integer,
  token_candidate integer,
  token_total integer,
  cost_input_usd numeric(10, 6),
  cost_output_usd numeric(10, 6),
  cost_total_usd numeric(10, 6)
);

CREATE INDEX IF NOT EXISTS gemini_logs_created_at_idx ON public.gemini_logs (created_at DESC);

-- Enable RLS (admin-only via service role, no public policies)
ALTER TABLE public.gemini_logs ENABLE ROW LEVEL SECURITY;

-- --- OTA app bundles migration ---

-- OTA app bundles table for self-hosted update server
CREATE TABLE IF NOT EXISTS public.app_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('production', 'alpha')),
  version text NOT NULL,
  storage_path text NOT NULL,
  checksum text NOT NULL,
  min_version_code integer NOT NULL,
  max_version_code integer,
  active boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_bundles_channel_version_key UNIQUE (channel, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS app_bundles_one_active_per_channel
  ON public.app_bundles (channel)
  WHERE active = true;

ALTER TABLE public.app_bundles ENABLE ROW LEVEL SECURITY;

-- Public storage bucket for OTA zip bundles
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-bundles', 'app-bundles', true)
ON CONFLICT (id) DO NOTHING;




-- --- photo import ---

-- Private bucket for user-photographed recipe sources (cookbook pages, recipe
-- cards). Written by POST /api/extract-recipe/photos, read and deleted again by
-- the worker; service-role only, no policies. Photos live here only between the
-- API request and the worker run — orphans are swept by sweepOldPhotoImports.
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-photos', 'recipe-photos', false)
ON CONFLICT (id) DO NOTHING;


-- --- soft-delete for jobs ---

-- Jobs are never physically deleted; instead deleted_at is stamped.
-- This prevents users from circumventing the rate-limit window by deleting
-- completed extractions — getExtractionsForUserInTimeframe deliberately
-- does NOT filter by deleted_at so soft-deleted jobs still consume quota.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Partial index: speeds up the most common query pattern (only live jobs).
CREATE INDEX IF NOT EXISTS jobs_user_not_deleted_idx
  ON public.jobs (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- --- smart AI push notifications ---

-- FCM device tokens. One user can have multiple devices, so the token itself is
-- the primary key (a token is globally unique in FCM). Written and read only by
-- the backend (service role) via POST/DELETE /api/push/tokens and the
-- notification worker; RLS enabled without policies -> service-role only, like
-- gemini_logs / app_bundles. `disabled` is flipped by the sender when FCM
-- reports the token as UNREGISTERED so dead devices are skipped without a delete.
CREATE TABLE IF NOT EXISTS public.push_tokens (
  token        text PRIMARY KEY,
  user_id      uuid NOT NULL,
  platform     text NOT NULL DEFAULT 'android',
  disabled     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens (user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- One row per delivered notification. Drives frequency capping (max N/day/week)
-- and anti-repeat dedupe (don't resend the same recipe / notification type back
-- to back). Service-role only, no policies.
CREATE TABLE IF NOT EXISTS public.notification_log (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL,
  sent_at  timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,
  type     text NOT NULL,
  job_id   text,
  title    text
);

CREATE INDEX IF NOT EXISTS notification_log_user_sent_idx
  ON public.notification_log (user_id, sent_at DESC);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

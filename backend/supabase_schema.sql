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
  ('beta_active', 'false', 'Enable or disable the beta tier auto-assignment and access'),
  ('beta_max_extractions_per_window', '10', 'Number of extractions beta users can perform in the rolling window'),
  ('beta_max_saved_recipes', '20', 'Max number of saved recipes beta users can keep in their cookbook'),
  ('free_max_extractions_per_window', '3', 'Number of extractions free users can perform in the rolling window'),
  ('free_max_saved_recipes', '5', 'Max number of saved recipes free users can keep in their cookbook'),
  ('premium_max_extractions_per_window', '50', 'Number of extractions premium users can perform in the rolling window'),
  ('premium_max_saved_recipes', '-1', 'Max number of saved recipes premium users can keep in their cookbook (-1 for unlimited)')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;

-- --- organizing features migration ---

-- Phase A: Add is_favorite to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Phase B: Add flags to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}';

-- Phase B: Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text,
  color text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phase B: Recipe Collections Join Table
CREATE TABLE IF NOT EXISTS public.recipe_collections (
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
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


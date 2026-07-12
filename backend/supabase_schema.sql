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

-- Insert initial values for the beta tier control and limits
INSERT INTO public.global_settings (key, value, description) VALUES
  ('beta_active', 'false', 'Enable or disable the beta tier auto-assignment and access'),
  ('beta_max_extractions_per_window', '10', 'Number of extractions beta users can perform in the rolling window'),
  ('beta_max_saved_recipes', '20', 'Max number of saved recipes beta users can keep in their cookbook')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;

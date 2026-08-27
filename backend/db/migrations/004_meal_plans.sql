-- Migration 004: Create meal_plans table for weekly meal planner
create table if not exists public.meal_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  plan_date  date not null,
  meal_type  text not null default 'dinner'
               check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  servings   numeric not null default 2,
  is_cooked  boolean not null default false,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast user-specific date range queries
create index if not exists idx_meal_plans_user_date on public.meal_plans(user_id, plan_date);

-- Enable RLS
alter table public.meal_plans enable row level security;

-- Policies for RLS
create policy "Users manage own meal plans"
  on public.meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

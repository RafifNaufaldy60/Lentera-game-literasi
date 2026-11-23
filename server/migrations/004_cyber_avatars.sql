-- The original four keys remain valid so existing profiles keep working.
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_avatar_key_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_avatar_key_check
  CHECK (avatar_key IN (
    'orbit', 'pixel', 'spark', 'shield',
    'neon-luna', 'neon-kiro', 'neon-rio', 'neon-axel',
    'neon-nova', 'neon-nira', 'neon-yuki'
  ));

ALTER TABLE public.user_profiles
  ALTER COLUMN avatar_key SET DEFAULT 'neon-luna';

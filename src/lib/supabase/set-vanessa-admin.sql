
-- 1. Ensure the profile exists (this happens automatically on signup via trigger, but good to be safe)
-- If the user hasn't signed up yet, this won't do anything until they do.
-- The most robust way is to update the role based on email.

-- Update the role for the user with the specific email
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'vanessa@milys.shop';

-- Verify the update
SELECT * FROM public.profiles WHERE email = 'vanessa@milys.shop';

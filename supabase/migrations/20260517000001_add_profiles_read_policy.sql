-- Add RLS policy so all authenticated users can view active profiles
-- Required for the chat DM user list to work

CREATE POLICY "Authenticated users can view active profiles"
  ON profiles FOR SELECT
  USING (is_active = true);
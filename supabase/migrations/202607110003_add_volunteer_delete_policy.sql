-- Allow super_admin to delete volunteer records (GDPR right to erasure)
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_delete_volunteers" ON volunteers;
CREATE POLICY "super_admin_delete_volunteers" ON volunteers
  FOR DELETE USING (get_my_role() = 'super_admin');

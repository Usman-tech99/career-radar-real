-- Allow super_admin to delete volunteer records (GDPR right to erasure)
CREATE POLICY "super_admin_delete_volunteers" ON volunteers
  FOR DELETE USING (get_my_role() = 'super_admin');

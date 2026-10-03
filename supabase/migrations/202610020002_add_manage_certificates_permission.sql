-- Add manage_certificates permission to admin roles
DO $$
BEGIN
  -- Add to admin role
  UPDATE user_roles
  SET permissions = array_append(permissions, 'manage_certificates')
  WHERE role = 'admin' AND NOT 'manage_certificates' = ANY(permissions);

  -- Add to super_admin role (should already have all, but ensure it)
  UPDATE user_roles
  SET permissions = array_append(permissions, 'manage_certificates')
  WHERE role = 'super_admin' AND NOT 'manage_certificates' = ANY(permissions);
END $$;

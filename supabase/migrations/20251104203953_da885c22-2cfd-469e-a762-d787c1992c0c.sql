-- Create function to create group with creator as admin
CREATE OR REPLACE FUNCTION create_group_with_admin(
  p_name TEXT,
  p_description TEXT,
  p_created_by UUID,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Insert the group
  INSERT INTO groups (name, description, created_by, photo_url)
  VALUES (p_name, p_description, p_created_by, p_photo_url)
  RETURNING id INTO v_group_id;

  -- Add creator as admin member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, p_created_by, 'admin');

  RETURN v_group_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_group_with_admin(TEXT, TEXT, UUID, TEXT) TO authenticated;
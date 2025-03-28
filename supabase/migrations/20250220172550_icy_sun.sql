/*
  # Update Storage Policies

  1. Changes
    - Safely update existing storage policies
    - Ensure RLS is enabled
    - Update policy conditions for better security
  
  2. Security
    - Users can only access their own files in each bucket
    - Files are organized in user-specific folders
    - Full CRUD access for authenticated users to their own files
*/

-- Make sure RLS is enabled
DO $$ 
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Update or create documents policy
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow users to manage their own documents" ON storage.objects;
  
  -- Create new policy
  CREATE POLICY "Allow users to manage their own documents"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
END $$;

-- Update or create recordings policy
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow users to manage their own recordings" ON storage.objects;
  
  -- Create new policy
  CREATE POLICY "Allow users to manage their own recordings"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
END $$;
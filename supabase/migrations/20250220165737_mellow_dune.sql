/*
  # Storage policies for document and recording buckets

  1. New Policies
    - Allow authenticated users to manage their own files in the documents bucket
    - Allow authenticated users to manage their own files in the recordings bucket
    
  2. Security
    - Enable RLS on storage buckets
    - Restrict access to user's own files only
*/

-- Documents bucket policies
CREATE POLICY "Allow users to manage their own documents"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Recordings bucket policies
CREATE POLICY "Allow users to manage their own recordings"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
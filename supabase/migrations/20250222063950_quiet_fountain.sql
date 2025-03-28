/*
  # Add name constraints for audio transcripts and documents

  1. Changes
    - Add name columns with safe defaults
    - Add unique constraints for names per user
    - Add indexes for better query performance

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Add unique constraints for audio_transcripts
DO $$ 
BEGIN
  -- Add name column if it doesn't exist (nullable first)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'audio_transcripts' 
    AND column_name = 'name'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE audio_transcripts ADD COLUMN name text;
    
    -- Set default names for existing records
    UPDATE audio_transcripts 
    SET name = 'Recording_' || id::text 
    WHERE name IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE audio_transcripts ALTER COLUMN name SET NOT NULL;
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_transcript_name_per_user'
  ) THEN
    ALTER TABLE audio_transcripts 
    ADD CONSTRAINT unique_transcript_name_per_user 
    UNIQUE (user_id, name);
  END IF;

  -- Add index for name lookups if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'audio_transcripts'
    AND indexname = 'idx_audio_transcripts_name'
  ) THEN
    CREATE INDEX idx_audio_transcripts_name ON audio_transcripts (name);
  END IF;
END $$;

-- Add unique constraints for documents
DO $$ 
BEGIN
  -- Add name column if it doesn't exist (nullable first)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'name'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE documents ADD COLUMN name text;
    
    -- Set default names for existing records
    UPDATE documents 
    SET name = 'Document_' || id::text 
    WHERE name IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE documents ALTER COLUMN name SET NOT NULL;
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_document_name_per_user'
  ) THEN
    ALTER TABLE documents 
    ADD CONSTRAINT unique_document_name_per_user 
    UNIQUE (user_id, name);
  END IF;

  -- Add index for name lookups if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'documents'
    AND indexname = 'idx_documents_name'
  ) THEN
    CREATE INDEX idx_documents_name ON documents (name);
  END IF;
END $$;
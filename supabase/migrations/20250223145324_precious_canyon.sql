/*
  # Add case analysis table

  1. New Tables
    - `case_analysis`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, unique per user)
      - `analysis` (jsonb, stores structured analysis result)
      - `audio_transcript_id` (uuid, optional reference to audio_transcripts)
      - `document_id` (uuid, optional reference to documents)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on case_analysis table
    - Add policy for authenticated users to manage their own case analyses
    - Add unique constraint for case names per user

  3. Indexes
    - Index on user_id for faster lookups
    - Index on name for unique constraint performance
*/

-- Create case_analysis table
CREATE TABLE IF NOT EXISTS case_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  analysis jsonb NOT NULL,
  audio_transcript_id uuid REFERENCES audio_transcripts,
  document_id uuid REFERENCES documents,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_case_name_per_user UNIQUE (user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_case_analysis_user_id ON case_analysis (user_id);
CREATE INDEX IF NOT EXISTS idx_case_analysis_name ON case_analysis (name);

-- Enable RLS
ALTER TABLE case_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their own case analyses"
  ON case_analysis
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
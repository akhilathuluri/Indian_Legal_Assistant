/*
  # Initial Schema Setup for Legal Assistant

  1. New Tables
    - `audio_transcripts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `audio_url` (text)
      - `transcript` (text)
      - `language` (text)
      - `summary` (text)
      - `created_at` (timestamp)
    
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `file_url` (text)
      - `file_type` (text)
      - `extracted_text` (text)
      - `analysis` (text)
      - `created_at` (timestamp)
    
    - `case_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `query` (text)
      - `results` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create audio_transcripts table
CREATE TABLE IF NOT EXISTS audio_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  audio_url text NOT NULL,
  transcript text,
  language text NOT NULL,
  summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audio_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transcripts"
  ON audio_transcripts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  extracted_text text,
  analysis text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create case_searches table
CREATE TABLE IF NOT EXISTS case_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  query text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own searches"
  ON case_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
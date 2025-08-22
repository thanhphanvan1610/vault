/*
  # Create user vaults table for FortressPass

  1. New Tables
    - `user_vaults`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `encrypted_vault` (text) - The encrypted blob of user's password data
      - `salt` (text) - Salt for Argon2id key derivation
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `user_vaults` table
    - Add policies for authenticated users to access only their own data
    - Users can SELECT, INSERT, UPDATE their vault (no DELETE for safety)

  3. Important Notes
    - The `encrypted_vault` column stores the complete encrypted password database
    - The `salt` is not secret and is used for key derivation client-side
    - All sensitive operations happen client-side; server only stores encrypted blobs
*/

CREATE TABLE IF NOT EXISTS user_vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  encrypted_vault text NOT NULL,
  salt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_vaults ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own vault
CREATE POLICY "Users can read own vault"
  ON user_vaults
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own vault (first time setup)
CREATE POLICY "Users can insert own vault"
  ON user_vaults
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vault
CREATE POLICY "Users can update own vault"
  ON user_vaults
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_vaults_updated_at
  BEFORE UPDATE ON user_vaults
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_vaults_user_id_idx ON user_vaults(user_id);
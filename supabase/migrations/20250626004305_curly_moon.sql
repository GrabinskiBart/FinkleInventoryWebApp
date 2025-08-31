/*
  # Fix RLS policies for anonymous access

  1. Policy Updates
    - Update all policies on `items` table to allow anonymous access
    - Update all policies on `stock_reports` table to allow anonymous access
    - This enables the mock authentication system to work properly

  2. Security Notes
    - These policies allow anonymous access for development/demo purposes
    - In production, proper authentication should be implemented
    - Policies should be updated to use proper user authentication
*/

-- Drop existing policies for items table
DROP POLICY IF EXISTS "Authenticated users can select items" ON items;
DROP POLICY IF EXISTS "Authenticated users can insert items" ON items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON items;
DROP POLICY IF EXISTS "Authenticated users can delete items" ON items;

-- Create new policies for items table that allow anonymous access
CREATE POLICY "Allow anonymous select on items"
  ON items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on items"
  ON items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on items"
  ON items
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on items"
  ON items
  FOR DELETE
  TO anon
  USING (true);

-- Drop existing policies for stock_reports table
DROP POLICY IF EXISTS "Authenticated users can select stock_reports" ON stock_reports;
DROP POLICY IF EXISTS "Authenticated users can insert stock_reports" ON stock_reports;
DROP POLICY IF EXISTS "Authenticated users can update stock_reports" ON stock_reports;
DROP POLICY IF EXISTS "Authenticated users can delete stock_reports" ON stock_reports;

-- Create new policies for stock_reports table that allow anonymous access
CREATE POLICY "Allow anonymous select on stock_reports"
  ON stock_reports
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on stock_reports"
  ON stock_reports
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on stock_reports"
  ON stock_reports
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on stock_reports"
  ON stock_reports
  FOR DELETE
  TO anon
  USING (true);
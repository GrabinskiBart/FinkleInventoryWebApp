/*
  # Fix RLS policies for authenticated users

  1. Security Updates
    - Drop existing overly broad policies
    - Create specific policies for INSERT, SELECT, UPDATE, DELETE operations
    - Ensure authenticated users can perform all necessary operations
    - Add proper policies for both items and stock_reports tables

  2. Changes
    - Replace generic "Allow all operations" policies with specific operation policies
    - Ensure INSERT operations are explicitly allowed for authenticated users
    - Maintain security while allowing proper functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on items" ON items;
DROP POLICY IF EXISTS "Allow all operations on stock_reports" ON stock_reports;

-- Create specific policies for items table
CREATE POLICY "Allow authenticated users to select items"
  ON items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert items"
  ON items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update items"
  ON items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete items"
  ON items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create specific policies for stock_reports table
CREATE POLICY "Allow authenticated users to select stock_reports"
  ON stock_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert stock_reports"
  ON stock_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update stock_reports"
  ON stock_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete stock_reports"
  ON stock_reports
  FOR DELETE
  TO authenticated
  USING (true);
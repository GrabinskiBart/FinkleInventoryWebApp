/*
  # Fix Row Level Security Policies

  1. Security Updates
    - Update RLS policies for `items` table to properly handle authenticated users
    - Update RLS policies for `stock_reports` table to properly handle authenticated users
    - Ensure policies work with Supabase auth context

  2. Changes Made
    - Replace overly restrictive policies with proper authentication-based policies
    - Allow authenticated users to perform CRUD operations on both tables
    - Use `auth.uid() IS NOT NULL` to check for authenticated users
*/

-- Drop existing policies for items table
DROP POLICY IF EXISTS "Allow authenticated users to delete items" ON items;
DROP POLICY IF EXISTS "Allow authenticated users to insert items" ON items;
DROP POLICY IF EXISTS "Allow authenticated users to select items" ON items;
DROP POLICY IF EXISTS "Allow authenticated users to update items" ON items;

-- Create new policies for items table
CREATE POLICY "Authenticated users can select items"
  ON items
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert items"
  ON items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update items"
  ON items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete items"
  ON items
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Drop existing policies for stock_reports table
DROP POLICY IF EXISTS "Allow authenticated users to delete stock_reports" ON stock_reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert stock_reports" ON stock_reports;
DROP POLICY IF EXISTS "Allow authenticated users to select stock_reports" ON stock_reports;
DROP POLICY IF EXISTS "Allow authenticated users to update stock_reports" ON stock_reports;

-- Create new policies for stock_reports table
CREATE POLICY "Authenticated users can select stock_reports"
  ON stock_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert stock_reports"
  ON stock_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update stock_reports"
  ON stock_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete stock_reports"
  ON stock_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
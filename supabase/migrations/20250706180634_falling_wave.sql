/*
  # Clear all database data

  1. Data Cleanup
    - Remove all records from `stock_reports` table
    - Remove all records from `items` table
    - Reset tables to empty state for fresh data entry

  2. Notes
    - This will permanently delete all existing data
    - Tables and structure remain intact
    - Only data is removed
*/

-- Clear all stock reports first (due to foreign key constraint)
DELETE FROM stock_reports;

-- Clear all items
DELETE FROM items;
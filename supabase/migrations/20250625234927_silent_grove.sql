/*
  # Restaurant Stock Management Schema

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `current_stock` (integer)
      - `min_stock_level` (integer)
      - `max_stock_level` (integer)
      - `needs_reorder` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `stock_reports`
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `user_name` (text)
      - `item_id` (uuid, foreign key)
      - `item_name` (text)
      - `reported_stock` (integer)
      - `previous_stock` (integer)
      - `report_type` (text)
      - `notes` (text, optional)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  current_stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 0,
  max_stock_level integer NOT NULL DEFAULT 100,
  needs_reorder boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_reports table
CREATE TABLE IF NOT EXISTS stock_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  reported_stock integer NOT NULL DEFAULT 0,
  previous_stock integer NOT NULL DEFAULT 0,
  report_type text NOT NULL CHECK (report_type IN ('stock_update', 'low_stock_alert', 'out_of_stock')),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'applied')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for items table (allow all operations for now)
CREATE POLICY "Allow all operations on items"
  ON items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for stock_reports table (allow all operations for now)
CREATE POLICY "Allow all operations on stock_reports"
  ON stock_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial restaurant data
INSERT INTO items (name, description, category, current_stock, min_stock_level, max_stock_level, needs_reorder) VALUES
-- Proteins
('Ground Beef', '80/20 ground beef for burgers and tacos', 'Proteins', 15, 20, 80, true),
('Chicken Breast', 'Fresh boneless chicken breast', 'Proteins', 25, 15, 60, false),
('Salmon Fillets', 'Fresh Atlantic salmon fillets', 'Proteins', 8, 12, 40, true),

-- Produce
('Romaine Lettuce', 'Fresh romaine lettuce heads', 'Produce', 0, 10, 50, true),
('Tomatoes', 'Fresh vine-ripened tomatoes', 'Produce', 18, 15, 60, false),
('Onions', 'Yellow cooking onions', 'Produce', 5, 12, 40, true),

-- Dairy
('Mozzarella Cheese', 'Whole milk mozzarella blocks', 'Dairy', 12, 8, 30, false),
('Heavy Cream', '35% heavy whipping cream', 'Dairy', 3, 6, 24, true),

-- Pantry
('Olive Oil', 'Extra virgin olive oil', 'Pantry', 4, 3, 15, false),
('All-Purpose Flour', '50lb bags of all-purpose flour', 'Pantry', 2, 4, 20, true),

-- Beverages
('Coffee Beans', 'Premium arabica coffee beans', 'Beverages', 8, 5, 25, false),
('Orange Juice', 'Fresh squeezed orange juice', 'Beverages', 1, 6, 20, true);

-- Create function to update needs_reorder automatically
CREATE OR REPLACE FUNCTION update_needs_reorder()
RETURNS TRIGGER AS $$
BEGIN
  NEW.needs_reorder := NEW.current_stock <= NEW.min_stock_level;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update needs_reorder
CREATE TRIGGER trigger_update_needs_reorder
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_needs_reorder();
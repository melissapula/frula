-- Add three_quarter_baths column to listings table
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS three_quarter_baths INTEGER;

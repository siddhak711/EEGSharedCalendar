-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bands table
CREATE TABLE IF NOT EXISTS bands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_submitted BOOLEAN DEFAULT FALSE NOT NULL,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create band_calendars table
CREATE TABLE IF NOT EXISTS band_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(band_id, date)
);

-- Create bandmates table
CREATE TABLE IF NOT EXISTS bandmates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  name TEXT,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create bandmate_availability table
CREATE TABLE IF NOT EXISTS bandmate_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bandmate_id UUID NOT NULL REFERENCES bandmates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_unavailable BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(bandmate_id, date)
);

-- Create bill_requests table
CREATE TABLE IF NOT EXISTS bill_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requesting_band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  target_band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(requesting_band_id, target_band_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bands_leader_id ON bands(leader_id);
CREATE INDEX IF NOT EXISTS idx_bands_calendar_submitted ON bands(calendar_submitted);
CREATE INDEX IF NOT EXISTS idx_band_calendars_band_id ON band_calendars(band_id);
CREATE INDEX IF NOT EXISTS idx_band_calendars_date ON band_calendars(date);
CREATE INDEX IF NOT EXISTS idx_bandmates_band_id ON bandmates(band_id);
CREATE INDEX IF NOT EXISTS idx_bandmates_token ON bandmates(token);
CREATE INDEX IF NOT EXISTS idx_bandmate_availability_bandmate_id ON bandmate_availability(bandmate_id);
CREATE INDEX IF NOT EXISTS idx_bandmate_availability_date ON bandmate_availability(date);
CREATE INDEX IF NOT EXISTS idx_bill_requests_requesting_band_id ON bill_requests(requesting_band_id);
CREATE INDEX IF NOT EXISTS idx_bill_requests_target_band_id ON bill_requests(target_band_id);
CREATE INDEX IF NOT EXISTS idx_bill_requests_status ON bill_requests(status);
CREATE INDEX IF NOT EXISTS idx_bill_requests_date ON bill_requests(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_bands_updated_at
  BEFORE UPDATE ON bands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_requests_updated_at
  BEFORE UPDATE ON bill_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


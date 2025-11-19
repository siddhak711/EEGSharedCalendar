-- Function to generate default availability for all days over 6 months
-- This function will be called when a band is created or when calendar is initialized
CREATE OR REPLACE FUNCTION generate_default_availability(p_band_id UUID)
RETURNS VOID AS $$
DECLARE
  start_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '6 months';
  curr_date DATE;
BEGIN
  -- Loop through all dates in the next 6 months
  curr_date := start_date;
  
  WHILE curr_date <= end_date LOOP
    -- Insert all days (Monday through Sunday) as available
    INSERT INTO band_calendars (band_id, date, is_available)
    VALUES (p_band_id, curr_date, TRUE)
    ON CONFLICT (band_id, date) DO NOTHING;
    
    curr_date := curr_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate calendar before submission
-- Returns TRUE if calendar has at least one available date, FALSE otherwise
CREATE OR REPLACE FUNCTION validate_calendar_submission(p_band_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  available_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO available_count
  FROM band_calendars
  WHERE band_id = p_band_id
  AND is_available = TRUE;
  
  RETURN available_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get band calendar with availability status
-- This can be used to check if a band is available on a specific date
CREATE OR REPLACE FUNCTION get_band_availability(p_band_id UUID, p_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  is_avail BOOLEAN;
BEGIN
  SELECT is_available INTO is_avail
  FROM band_calendars
  WHERE band_id = p_band_id
  AND date = p_date;
  
  RETURN COALESCE(is_avail, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get bandmate by token (for anonymous access)
-- SECURITY DEFINER allows the function to bypass RLS
CREATE OR REPLACE FUNCTION get_bandmate_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  band_id UUID,
  band_name TEXT,
  band_calendar_submitted BOOLEAN,
  name TEXT,
  token TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bandmates.id,
    bandmates.band_id,
    bands.name as band_name,
    bands.calendar_submitted as band_calendar_submitted,
    bandmates.name,
    bandmates.token,
    bandmates.created_at
  FROM bandmates
  JOIN bands ON bands.id = bandmates.band_id
  WHERE bandmates.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get bandmate availability by token (for anonymous access)
-- SECURITY DEFINER allows the function to bypass RLS
CREATE OR REPLACE FUNCTION get_bandmate_availability_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  bandmate_id UUID,
  date DATE,
  is_unavailable BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_bandmate_id UUID;
BEGIN
  -- Get bandmate ID from token
  SELECT bandmates.id INTO v_bandmate_id
  FROM bandmates
  WHERE bandmates.token = p_token;
  
  IF v_bandmate_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return availability
  RETURN QUERY
  SELECT bandmate_availability.id, bandmate_availability.bandmate_id, bandmate_availability.date, bandmate_availability.is_unavailable, bandmate_availability.created_at
  FROM bandmate_availability
  WHERE bandmate_availability.bandmate_id = v_bandmate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update bandmate availability by token (for anonymous access)
-- SECURITY DEFINER allows the function to bypass RLS
-- Optimized to use a single query for better performance
CREATE OR REPLACE FUNCTION update_bandmate_availability_by_token(
  p_token TEXT,
  p_date DATE,
  p_is_unavailable BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  v_availability_id UUID;
BEGIN
  -- Upsert availability in a single query using subquery to get bandmate_id
  -- Cast p_date explicitly to DATE to ensure no timezone issues
  INSERT INTO bandmate_availability (bandmate_id, date, is_unavailable)
  SELECT 
    bm.id,
    p_date::DATE,
    p_is_unavailable
  FROM bandmates bm
  WHERE bm.token = p_token
  ON CONFLICT (bandmate_id, date) DO UPDATE
  SET is_unavailable = p_is_unavailable
  RETURNING id INTO v_availability_id;
  
  -- If no row was inserted/updated, the token was invalid
  IF v_availability_id IS NULL THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;
  
  RETURN v_availability_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get band calendar by bandmate token (for anonymous access)
-- SECURITY DEFINER allows the function to bypass RLS
CREATE OR REPLACE FUNCTION get_band_calendar_by_bandmate_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  band_id UUID,
  date DATE,
  is_available BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_band_id UUID;
BEGIN
  -- Get band ID from bandmate token
  SELECT bandmates.band_id INTO v_band_id
  FROM bandmates
  WHERE bandmates.token = p_token;
  
  IF v_band_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return band calendar
  RETURN QUERY
  SELECT band_calendars.id, band_calendars.band_id, band_calendars.date, band_calendars.is_available, band_calendars.created_at
  FROM band_calendars
  WHERE band_calendars.band_id = v_band_id
  ORDER BY band_calendars.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get final band availability considering bandmate unavailability
-- SECURITY DEFINER allows the function to bypass RLS for public calendar viewing
CREATE OR REPLACE FUNCTION get_band_availability_with_bandmates(p_band_id UUID)
RETURNS TABLE (
  date DATE,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.date::DATE,
    CASE 
      WHEN bc.is_available = TRUE AND NOT EXISTS (
        SELECT 1 
        FROM bandmate_availability ba
        JOIN bandmates bm ON bm.id = ba.bandmate_id
        WHERE bm.band_id = p_band_id
        AND ba.date::DATE = bc.date::DATE
        AND ba.is_unavailable = TRUE
      ) THEN TRUE
      ELSE FALSE
    END as is_available
  FROM band_calendars bc
  WHERE bc.band_id = p_band_id
  ORDER BY bc.date::DATE ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable Row Level Security
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandmates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandmate_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_requests ENABLE ROW LEVEL SECURITY;

-- Bands table policies
-- Band leaders can manage their own bands
CREATE POLICY "Band leaders can view their own bands"
  ON bands FOR SELECT
  USING (auth.uid() = leader_id);

CREATE POLICY "Band leaders can create their own bands"
  ON bands FOR INSERT
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Band leaders can update their own bands"
  ON bands FOR UPDATE
  USING (auth.uid() = leader_id);

CREATE POLICY "Band leaders can delete their own bands"
  ON bands FOR DELETE
  USING (auth.uid() = leader_id);

-- Authenticated users can view submitted calendars (for main calendar view)
CREATE POLICY "Authenticated users can view submitted bands"
  ON bands FOR SELECT
  USING (calendar_submitted = TRUE);

-- Band calendars table policies
-- Band leaders can manage their own band calendars
CREATE POLICY "Band leaders can view their own band calendars"
  ON band_calendars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = band_calendars.band_id
      AND bands.leader_id = auth.uid()
    )
  );

CREATE POLICY "Band leaders can manage their own band calendars"
  ON band_calendars FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = band_calendars.band_id
      AND bands.leader_id = auth.uid()
    )
  );

-- Authenticated users can view submitted band calendars
CREATE POLICY "Authenticated users can view submitted band calendars"
  ON band_calendars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = band_calendars.band_id
      AND bands.calendar_submitted = TRUE
    )
  );

-- Bandmates table policies
-- Band leaders can view and manage bandmates for their bands
CREATE POLICY "Band leaders can view bandmates for their bands"
  ON bandmates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = bandmates.band_id
      AND bands.leader_id = auth.uid()
    )
  );

CREATE POLICY "Band leaders can create bandmates for their bands"
  ON bandmates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = bandmates.band_id
      AND bands.leader_id = auth.uid()
    )
  );

CREATE POLICY "Band leaders can delete bandmates for their bands"
  ON bandmates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = bandmates.band_id
      AND bands.leader_id = auth.uid()
    )
  );

-- Bandmate availability table policies
-- Band leaders can view bandmate availability for their bands
CREATE POLICY "Band leaders can view bandmate availability"
  ON bandmate_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bandmates
      JOIN bands ON bands.id = bandmates.band_id
      WHERE bandmates.id = bandmate_availability.bandmate_id
      AND bands.leader_id = auth.uid()
    )
  );

-- Public access for bandmate availability via token (handled in API)
-- This will be managed through API routes that validate tokens

-- Bill requests table policies
-- Band leaders can view bill requests for their bands
CREATE POLICY "Band leaders can view bill requests for their bands"
  ON bill_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = bill_requests.requesting_band_id
      AND bands.leader_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = bill_requests.target_band_id
      AND bands.leader_id = auth.uid()
    )
  );

-- Band leaders can create bill requests for their bands
CREATE POLICY "Band leaders can create bill requests"
  ON bill_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = bill_requests.requesting_band_id
      AND bands.leader_id = auth.uid()
      AND bands.calendar_submitted = TRUE
    )
  );

-- Target band leaders can update bill requests (accept/reject)
CREATE POLICY "Target band leaders can update bill requests"
  ON bill_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = bill_requests.target_band_id
      AND bands.leader_id = auth.uid()
    )
  );


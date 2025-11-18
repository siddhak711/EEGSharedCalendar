export type Band = {
  id: string
  name: string
  leader_id: string
  calendar_submitted: boolean
  share_token: string | null
  created_at: string
  updated_at: string
}

export type BandCalendar = {
  id: string
  band_id: string
  date: string
  is_available: boolean
  created_at: string
}

export type Bandmate = {
  id: string
  band_id: string
  name: string | null
  token: string
  created_at: string
}

export type BandmateAvailability = {
  id: string
  bandmate_id: string
  date: string
  is_unavailable: boolean
  created_at: string
}

export type BillRequest = {
  id: string
  requesting_band_id: string
  target_band_id: string
  date: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export type BillRequestWithBands = BillRequest & {
  requesting_band: Band
  target_band: Band
}


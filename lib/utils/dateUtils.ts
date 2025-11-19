import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek } from 'date-fns'

/**
 * Parse a YYYY-MM-DD date string as a local date (not UTC)
 * This prevents timezone shifts when parsing date strings
 */
function parseLocalDate(dateStr: string): Date {
  // If it's in YYYY-MM-DD format, parse it as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    // Create date at local midnight (not UTC)
    return new Date(year, month - 1, day)
  }
  // For other formats, use standard parsing
  return new Date(dateStr)
}

/**
 * Normalize a date to YYYY-MM-DD format string
 * Handles Date objects, ISO strings, and date strings
 * Avoids timezone issues by parsing date strings directly when possible
 */
export function normalizeDate(date: string | Date): string {
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    // If it's an ISO string (with time), extract just the date part before T
    if (date.includes('T')) {
      const datePart = date.split('T')[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart
      }
    }
    // Try to extract YYYY-MM-DD from any date-like string
    const dateMatch = date.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      // Validate the match looks like a valid date
      const [, year, month, day] = dateMatch
      if (year && month && day) {
        return `${year}-${month}-${day}`
      }
    }
    // Last resort: try to parse and format
    try {
      const dateObj = parseLocalDate(date)
      if (!isNaN(dateObj.getTime())) {
        // When converting Date back to string, use local date components
        // to preserve the intended date (not UTC date which could be different)
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    } catch {
      // If parsing fails, return as-is
      return date
    }
  }
  // If it's a Date object, extract local date components to preserve intended date
  // Note: For dates from database (DATE type), they may be at UTC midnight
  // In that case, we want to preserve the UTC date, not convert to local
  if (date instanceof Date && !isNaN(date.getTime())) {
    // Check if this looks like a UTC midnight date (common for database DATE values)
    // If hours/minutes/seconds are all 0, it might be a database DATE at UTC midnight
    const isLikelyUTC = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && 
                       date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0
    
    if (isLikelyUTC) {
      // Use UTC components to preserve database DATE value
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } else {
      // Use local components for dates created in local time
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
  // Fallback: try to convert to string
  return String(date)
}

/**
 * Get all days for the next 6 months
 * Returns dates as YYYY-MM-DD strings
 */
export function getWeekendNightsForNext6Months(): string[] {
  const today = new Date()
  const sixMonthsFromNow = addMonths(today, 6)
  
  const startDate = startOfMonth(today)
  const endDate = endOfMonth(sixMonthsFromNow)
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })
  
  // Return all days (Monday through Sunday)
  return allDays.map(day => format(day, 'yyyy-MM-dd'))
}

/**
 * Check if a date is a Friday, Saturday, or Sunday
 * @deprecated This function is kept for backward compatibility but all days are now supported
 */
export function isWeekendNight(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date
  const dayOfWeek = getDay(dateObj)
  return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date
  return format(dateObj, 'EEEE, MMMM d, yyyy')
}

/**
 * Format date for calendar grid
 */
export function formatDateForGrid(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date
  return format(dateObj, 'MMM d')
}

/**
 * Get month name from date
 */
export function getMonthName(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date
  return format(dateObj, 'MMMM yyyy')
}

/**
 * Group dates by month
 */
export function groupDatesByMonth(dates: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  
  dates.forEach(date => {
    const dateObj = parseLocalDate(date)
    const monthKey = format(dateObj, 'yyyy-MM')
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = []
    }
    
    grouped[monthKey].push(date)
  })
  
  return grouped
}

/**
 * Group dates by weeks (7 days per row) for calendar display
 * Returns an array of weeks, where each week is an array of 7 dates (or null for padding)
 */
export function groupDatesByWeeks(dates: string[]): (string | null)[][] {
  if (dates.length === 0) return []
  
  const weeks: (string | null)[][] = []
  const dateSet = new Set(dates)
  
  // Get the first and last dates, parsing as local dates
  const firstDate = parseLocalDate(dates[0])
  const lastDate = parseLocalDate(dates[dates.length - 1])
  
  // Get the start of the week containing the first date (Sunday)
  const weekStart = startOfWeek(firstDate, { weekStartsOn: 0 })
  // Get the end of the week containing the last date (Saturday)
  const weekEnd = endOfWeek(lastDate, { weekStartsOn: 0 })
  
  // Generate all days from weekStart to weekEnd
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  // Group into weeks
  let currentWeek: (string | null)[] = []
  allDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    
    // If this date is in our date set, include it; otherwise use null for padding
    if (dateSet.has(dateStr)) {
      currentWeek.push(dateStr)
    } else {
      currentWeek.push(null)
    }
    
    // If we've filled a week (7 days), start a new week
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  
  // Add the last incomplete week if it exists
  if (currentWeek.length > 0) {
    // Pad to 7 days
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }
  
  return weeks
}


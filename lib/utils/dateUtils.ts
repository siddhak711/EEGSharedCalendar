import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek } from 'date-fns'

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
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dayOfWeek = getDay(dateObj)
  return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'EEEE, MMMM d, yyyy')
}

/**
 * Format date for calendar grid
 */
export function formatDateForGrid(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM d')
}

/**
 * Get month name from date
 */
export function getMonthName(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMMM yyyy')
}

/**
 * Group dates by month
 */
export function groupDatesByMonth(dates: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  
  dates.forEach(date => {
    const dateObj = new Date(date)
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
  
  // Get the first and last dates
  const firstDate = new Date(dates[0])
  const lastDate = new Date(dates[dates.length - 1])
  
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


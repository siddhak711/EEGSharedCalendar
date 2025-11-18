import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'

/**
 * Get all Friday, Saturday, and Sunday nights for the next 6 months
 * Returns dates as YYYY-MM-DD strings
 */
export function getWeekendNightsForNext6Months(): string[] {
  const today = new Date()
  const sixMonthsFromNow = addMonths(today, 6)
  
  const startDate = startOfMonth(today)
  const endDate = endOfMonth(sixMonthsFromNow)
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })
  
  // Filter for Friday (5), Saturday (6), and Sunday (0)
  const weekendNights = allDays
    .filter(day => {
      const dayOfWeek = getDay(day)
      return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0
    })
    .map(day => format(day, 'yyyy-MM-dd'))
  
  return weekendNights
}

/**
 * Check if a date is a Friday, Saturday, or Sunday
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


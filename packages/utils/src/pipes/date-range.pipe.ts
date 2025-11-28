import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a date range between two dates.
 *
 * @example
 * ```html
 * {{ [startDate, endDate] | dateRange }}
 * <!-- Output: "Jan 1 - Jan 5, 2024" -->
 *
 * {{ [startDate, endDate] | dateRange:'long' }}
 * <!-- Output: "January 1, 2024 - January 5, 2024" -->
 *
 * {{ [startDate, endDate] | dateRange:'short' }}
 * <!-- Output: "1/1/24 - 1/5/24" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'dateRange',
  standalone: true
})
export class DateRangePipe implements PipeTransform {
  /**
   * Transforms two dates into a formatted date range string.
   *
   * @param value - Array containing [startDate, endDate]
   * @param format - Output format: 'short', 'medium', or 'long'
   * @returns Formatted date range string
   */
  transform(
    value: [Date | string | number, Date | string | number] | null | undefined,
    format: 'short' | 'medium' | 'long' = 'medium'
  ): string {
    if (!value || !Array.isArray(value) || value.length !== 2) return '';

    const [start, end] = value.map(d => new Date(d));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' }
    };

    const options = formatOptions[format];

    // Same day
    if (this.isSameDay(start, end)) {
      return start.toLocaleDateString('en-US', options);
    }

    // Same month and year
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const monthYear = start.toLocaleDateString('en-US', { month: options.month, year: options.year });
      return `${start.getDate()} - ${end.getDate()}, ${monthYear}`;
    }

    // Same year
    if (start.getFullYear() === end.getFullYear()) {
      const startStr = start.toLocaleDateString('en-US', { month: options.month, day: options.day });
      const endStr = end.toLocaleDateString('en-US', options);
      return `${startStr} - ${endStr}`;
    }

    // Different years
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}

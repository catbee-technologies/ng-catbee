import { Pipe, PipeTransform } from '@angular/core';

/**
 * Calculates the number of business days between two dates (excludes weekends).
 *
 * @example
 * ```html
 * {{ [startDate, endDate] | businessDays }}
 * <!-- Output: "5" (number of business days) -->
 *
 * {{ [startDate, endDate] | businessDays:true }}
 * <!-- Output: "5 business days" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'businessDays',
  standalone: true
})
export class BusinessDaysPipe implements PipeTransform {
  /**
   * Calculates business days between two dates.
   *
   * @param value - Array containing [startDate, endDate]
   * @param verbose - If true, includes text description
   * @param holidays - Optional array of holiday dates to exclude
   * @returns Number of business days or formatted string
   */
  transform(
    value: [Date | string | number, Date | string | number] | null | undefined,
    verbose = false,
    holidays: (Date | string | number)[] = []
  ): string | number {
    if (!value || !Array.isArray(value) || value.length !== 2) return 0;

    const [start, end] = value.map(d => new Date(d));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const holidaySet = new Set(holidays.map(h => new Date(h).toDateString()));

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(current.toDateString());

      if (!isWeekend && !isHoliday) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    if (verbose) {
      return `${count} business day${count !== 1 ? 's' : ''}`;
    }

    return count;
  }
}

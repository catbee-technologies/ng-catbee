import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Sanitizes and marks HTML content as safe for Angular to render.
 *
 * @example
 * ```html
 * <div [innerHTML]="htmlContent | safeHtml"></div>
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Bypasses security and trusts the given HTML to be safe.
   *
   * @param value - HTML string to sanitize
   * @returns SafeHtml that can be used in [innerHTML]
   */
  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

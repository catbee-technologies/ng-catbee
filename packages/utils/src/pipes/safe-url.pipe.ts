import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Sanitizes and marks a URL as safe for Angular to use in resource contexts.
 *
 * @example
 * ```html
 * <iframe [src]="videoUrl | safeUrl"></iframe>
 * <img [src]="imageUrl | safeUrl">
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Bypasses security and trusts the given URL to be safe.
   *
   * @param value - URL string to sanitize
   * @returns SafeResourceUrl that can be used in [src]
   */
  transform(value: string | null | undefined): SafeResourceUrl {
    if (!value) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }
}

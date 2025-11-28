import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Highlights matching text in a string.
 *
 * @example
 * ```html
 * {{ 'The quick brown fox' | highlight:'quick' }}
 * <!-- Output: "The <mark>quick</mark> brown fox" -->
 *
 * {{ 'The quick brown fox' | highlight:'quick':'bg-yellow-200' }}
 * <!-- Custom CSS class -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Highlights matching text in the input string.
   *
   * @param value - The string to search in
   * @param search - The text to highlight
   * @param className - CSS class to apply (default: uses <mark> tag)
   * @returns SafeHtml with highlighted text
   */
  transform(value: string | null | undefined, search: string | null | undefined, className?: string): SafeHtml {
    if (!value || !search) {
      return value || '';
    }

    const regex = new RegExp(`(${this.escapeRegex(search)})`, 'gi');
    const highlighted = className
      ? value.replace(regex, `<span class="${className}">$1</span>`)
      : value.replace(regex, '<mark>$1</mark>');

    return this.sanitizer.sanitize(1, highlighted) || highlighted;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

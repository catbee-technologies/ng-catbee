import { isPlatformBrowser } from '@angular/common';
import { Directive, HostListener, inject, input, NgModule, output, PLATFORM_ID } from '@angular/core';

/**
 * Directive that copies text to clipboard when the host element is clicked.
 *
 * This directive uses the modern Clipboard API and is SSR-safe.
 * Emits success and error events for user feedback.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-code-snippet',
 *   template: `
 *     <pre>
 *       <code>{{ code }}</code>
 *       <button
 *         [copyToClipboard]="code"
 *         (copied)="onCopied()"
 *         (copyError)="onError($event)">
 *         Copy
 *       </button>
 *     </pre>
 *   `,
 *   standalone: true,
 *   imports: [CopyToClipboard]
 * })
 * export class CodeSnippetComponent {
 *   code = 'console.log("Hello World");';
 *   onCopied() { console.log('Copied!'); }
 *   onError(err: Error) { console.error('Copy failed:', err); }
 * }
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[copyToClipboard]',
  standalone: true
})
export class CopyToClipboard {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * The text to copy to clipboard.
   */
  readonly copyToClipboard = input<string>('');

  /**
   * Event emitted when text is successfully copied.
   */
  copied = output<void>();

  /**
   * Event emitted when copy operation fails.
   */
  copyError = output<Error>();

  @HostListener('click')
  async onClick(): Promise<void> {
    if (!this.copyToClipboard || !isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      await window.navigator.clipboard.writeText(this.copyToClipboard());
      this.copied.emit();
    } catch (error) {
      this.copyError.emit(error as Error);
    }
  }
}

@NgModule({
  imports: [CopyToClipboard],
  exports: [CopyToClipboard]
})
export class CopyToClipboardModule {}

import { isPlatformBrowser } from '@angular/common';
import { Directive, DOCUMENT, HostListener, inject, input, NgModule, output, PLATFORM_ID } from '@angular/core';

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
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** The text to copy to clipboard. (default: '') */
  readonly copyToClipboard = input<string>('');

  /** Event emitted when text is successfully copied. */
  copied = output<void>();

  /** Event emitted when copy operation fails. */
  copyError = output<Error>();

  @HostListener('keydown.space', ['$event'])
  onSpace(e: Event) {
    e.preventDefault();
    this.copy();
  }

  @HostListener('keydown.enter')
  @HostListener('click')
  async copy(): Promise<void> {
    if (!this.isBrowser) return;

    const input = this.copyToClipboard();
    if (!input) return;

    const clipboard = this.document.defaultView?.navigator?.clipboard;
    if (clipboard?.writeText) {
      try {
        await clipboard.writeText(input);
        this.copied.emit();
      } catch (err) {
        this.copyError.emit(err as Error);
      }
    } else {
      this.fallbackCopy(input);
    }
  }

  private fallbackCopy(text: string) {
    const textarea = this.document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    this.document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      this.document.execCommand('copy');
      this.copied.emit();
    } catch (err) {
      this.copyError.emit(err as Error);
    }

    this.document.body.removeChild(textarea);
  }
}

@NgModule({
  imports: [CopyToClipboard],
  exports: [CopyToClipboard]
})
export class CopyToClipboardModule {}

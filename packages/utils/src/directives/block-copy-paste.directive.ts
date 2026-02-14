import { Directive, HostListener, booleanAttribute, input, NgModule } from '@angular/core';

/**
 * Directive to block copy, paste, and cut actions on an element.
 *
 * @example
 * ```html
 * <input type="text" blockCopyPaste>
 * <textarea blockCopyPaste></textarea>
 * ```
 *
 * You can also configure which actions to block:
 * ```html
 * <input type="text" [blockCopy]="true" [blockPaste]="false" [blockCut]="true">
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[blockCopyPaste]',
  standalone: true
})
export class BlockCopyPaste {
  /** Input to block paste action (default: true) */
  readonly blockPaste = input(true, { transform: booleanAttribute });

  /** Input to block copy action (default: true) */
  readonly blockCopy = input(true, { transform: booleanAttribute });

  /** Input to block cut action (default: true) */
  readonly blockCut = input(true, { transform: booleanAttribute });

  /** Input to block drop action (default: true) */
  readonly blockDrop = input(true, { transform: booleanAttribute });

  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent) {
    if (!this.blockPaste()) return;
    e.preventDefault();
  }

  @HostListener('copy', ['$event'])
  onCopy(e: ClipboardEvent) {
    if (!this.blockCopy()) return;
    e.preventDefault();
  }

  @HostListener('cut', ['$event'])
  onCut(e: ClipboardEvent) {
    if (!this.blockCut()) return;
    e.preventDefault();
  }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent) {
    if (!this.blockDrop()) return;
    e.preventDefault();
  }
}

@NgModule({
  imports: [BlockCopyPaste],
  exports: [BlockCopyPaste]
})
export class BlockCopyPasteModule {}

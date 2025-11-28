import { Directive, HostListener, NgModule } from '@angular/core';

@Directive({
  selector: '[blockCopyPaste]',
  standalone: true
})
export class BlockCopyPaste {
  @HostListener('paste', ['$event'])
  blockPaste(e: Event | KeyboardEvent) {
    e.preventDefault();
  }

  @HostListener('copy', ['$event'])
  blockCopy(e: Event | KeyboardEvent) {
    e.preventDefault();
  }

  @HostListener('cut', ['$event'])
  blockCut(e: Event | KeyboardEvent) {
    e.preventDefault();
  }
}

@NgModule({
  imports: [BlockCopyPaste],
  exports: [BlockCopyPaste]
})
export class BlockCopyPasteModule {}

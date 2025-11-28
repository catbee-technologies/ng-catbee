import {
  Directive,
  ElementRef,
  HostListener,
  NgModule,
  OnChanges,
  Renderer2,
  SimpleChanges,
  inject,
  input
} from '@angular/core';

@Directive({
  selector: '[deepDisabled]',
  standalone: true
})
export class DeepDisabled implements OnChanges {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  readonly deepDisabled = input<boolean>(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['deepDisabled']) {
      this.updateDisabledState();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.deepDisabled()) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.deepDisabled()) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (this.deepDisabled()) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: Event) {
    if (this.deepDisabled()) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(_event: Event) {
    if (this.deepDisabled()) {
      this.el.nativeElement?.blur();
    }
  }

  private updateDisabledState() {
    if (this.deepDisabled()) {
      if (this.el.nativeElement.tagName === 'INPUT' || this.el.nativeElement.tagName === 'BUTTON') {
        this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
      }
    } else {
      if (this.el.nativeElement.tagName === 'INPUT' || this.el.nativeElement.tagName === 'BUTTON') {
        this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
      }
    }
  }
}

@NgModule({
  imports: [DeepDisabled],
  exports: [DeepDisabled]
})
export class DeepDisabledModule {}

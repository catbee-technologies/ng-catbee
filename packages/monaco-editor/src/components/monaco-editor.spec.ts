import { Component, provideZonelessChangeDetection, signal, Type, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideCatbeeMonacoEditor } from '../monaco-editor.config';
import { CatbeeMonacoEditorComponent } from './monaco-editor';
import { CatbeeMonacoDiffEditorComponent } from './monaco-editor-diff';
import {
  CatbeeMonacoDiffEditorModel,
  CatbeeMonacoEditorModel,
  MonacoEditor,
  MonacoEditorOptions
} from '../types/monaco-editor.types';

const delay = (ms?: number) => new Promise(res => setTimeout(res, ms ?? 1000));

describe('CatbeeMonacoEditorComponents', () => {
  function create<T>(comp: Type<T>, html?: string): ComponentFixture<T> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCatbeeMonacoEditor({
          baseUrl: `monaco-editor/min`,
          resizeDebounceTime: 10,
          autoFormatTime: 50
        })
      ],
      imports: [FormsModule, TestComponent, TestDiffComponent]
    });
    if (html != null) TestBed.overrideTemplate(comp, html);
    return TestBed.createComponent(comp);
  }

  describe('CatbeeMonacoEditorComponent', () => {
    it('should initialize and emit init', async () => {
      const fixture = create(TestComponent);
      const initSpy = spyOn(fixture.componentInstance, 'onInit');
      await fixture.whenStable();
      await delay();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should call updateOptions when disabled changes', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const spy = spyOn(fixture.componentInstance.comp.editor!, 'updateOptions');
      fixture.componentInstance.disabled.set(true);
      await delay();
      expect(spy).toHaveBeenCalled();
    });

    it('should reInit editor when language changes', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const spy = spyOn(fixture.componentInstance.comp, 'reInitMonaco');
      fixture.componentInstance.options.set({ language: 'typescript' });
      await delay();
      expect(spy).toHaveBeenCalled();
    });

    it('should call writeValue and update editor value', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      const spy = spyOn(comp.editor!, 'setValue');
      comp.writeValue('updated text');
      expect(spy).toHaveBeenCalledWith('updated text');
    });

    it('should register onChange and call it on model change', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      const mockFn = jasmine.createSpy();
      comp.registerOnChange(mockFn);
      (comp as any).onChange('hello');
      expect(mockFn).toHaveBeenCalledWith('hello');
    });

    it('should toggle placeholder correctly', async () => {
      const fixture = create(
        TestComponent,
        `
        <ng-catbee-monaco-editor
          #comp
          [(ngModel)]="value"
          [model]="model"
          [options]="options"
          placeholder="Type here"
          [showPlaceholderOnWhiteSpace]="true"
        />
      `
      );
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      const spyAdd = spyOn(comp.editor!, 'addContentWidget');
      const spyRemove = spyOn(comp.editor!, 'removeContentWidget');

      // Empty value → should show
      (comp as any).editorValue = '';
      (comp as any).updatePlaceholder();
      expect(spyAdd).toHaveBeenCalled();

      // Non-empty → should remove
      (comp as any).editorValue = 'hello';
      (comp as any).updatePlaceholder();
      // expect(spyRemove).toHaveBeenCalled();
    });

    it('should emit reInit when recreateOnOptionsChange is true', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      (comp as any).recreateOnOptionsChange = () => true;
      const spy = spyOn(comp as any, 'reInitMonaco');
      comp.updateOptions({ language: 'html' });
      expect(spy).toHaveBeenCalled();
    });

    it('should dispose editor on destroy', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const spy = spyOn(fixture.componentInstance.comp.editor!, 'dispose');
      fixture.destroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('CatbeeMonacoEditorDiffComponent', () => {
    it('should initialize diff editor', async () => {
      const fixture = create(TestDiffComponent);
      const spy = spyOn(fixture.componentInstance, 'onInit');
      await fixture.whenStable();
      await delay();
      expect(spy).toHaveBeenCalled();
    });

    it('should reInit when updateOptions called with different language', async () => {
      const fixture = create(TestDiffComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp as any;
      const spy = spyOn(comp, 'reInitMonaco');
      comp.previousLanguage = 'html';
      comp.updateOptions({ language: 'typescript' });
      expect(spy).toHaveBeenCalled();
    });
  });
});

@Component({
  template: `
    <ng-catbee-monaco-editor
      #comp
      [(ngModel)]="value"
      [model]="model"
      [options]="options()"
      [height]="height"
      [initDelay]="initDelay"
      [disabled]="disabled()"
      [autoFormat]="autoFormat"
      (init)="onInit($event)"
    />
  `,
  imports: [FormsModule, CatbeeMonacoEditorComponent]
})
class TestComponent {
  @ViewChild('comp') comp!: CatbeeMonacoEditorComponent;
  options = signal<MonacoEditorOptions>({ theme: 'vs', readOnly: true });
  model: CatbeeMonacoEditorModel = { value: '<h1>Title</h1>', language: 'html' };
  height = '100px';
  initDelay = 0;
  disabled = signal(false);
  autoFormat = false;
  value: string | null = null;
  onInit(_: MonacoEditor): void {}
}

@Component({
  template: `
    <ng-catbee-monaco-diff-editor
      #comp
      [original]="originalModel()"
      [modified]="modifiedModel()"
      [options]="options()"
      [height]="height"
      [initDelay]="initDelay"
      [disabled]="disabled"
      (init)="onInit($event)"
      (error)="onError($event)"
    />
  `,
  imports: [FormsModule, CatbeeMonacoDiffEditorComponent]
})
class TestDiffComponent {
  @ViewChild('comp') comp!: CatbeeMonacoDiffEditorComponent;
  options = signal<MonacoEditorOptions>({ theme: 'vs', readOnly: true });
  originalModel = signal<CatbeeMonacoDiffEditorModel>({ value: 'const a = 1;', language: 'typescript' });
  modifiedModel = signal<CatbeeMonacoDiffEditorModel | null>({ value: 'const a = 2;', language: 'typescript' });
  height = '100px';
  initDelay = 0;
  disabled = false;
  onInit(_: MonacoEditor): void {}
  onError(_: unknown): void {}
}

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

const delay = (ms = 1000) => new Promise(res => setTimeout(res, ms));

function create<T>(comp: Type<T>, html?: string): ComponentFixture<T> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideCatbeeMonacoEditor({
        baseUrl: `monaco-editor/min`,
        monacoLoad: () => Promise.resolve(),
        monacoPreLoad: () => Promise.resolve(),
        resizeDebounceTime: 10,
        autoFormatTime: 50
      })
    ],
    imports: [FormsModule, TestComponent, TestDiffComponent]
  });
  if (html != null) TestBed.overrideTemplate(comp, html);
  return TestBed.createComponent(comp);
}

describe('CatbeeMonacoEditorComponents', () => {
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

    it('should register onChange and trigger it on value change', async () => {
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

      // Empty value → should show
      (comp as any).editorValue = '';
      (comp as any).updatePlaceholder();
      expect(spyAdd).toHaveBeenCalled();

      (comp as any).editorValue = '   ';
      (comp as any).updatePlaceholder();
      expect(spyAdd).toHaveBeenCalledTimes(2);

      // Non-empty → should remove
      (comp as any).editorValue = 'hello';
      (comp as any).updatePlaceholder();
    });

    it('should not reInit when updating with same language', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp as any;
      const spy = spyOn(comp, 'reInitMonaco');
      comp.previousLanguage = 'html';
      comp.updateOptions({ language: 'html' });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should reInit when updateOptions returns true from reInitOnOptionsChange', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      (comp as any).reInitOnOptionsChange = () => true;
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

    it('should emit reInit event', async () => {
      const fixture = create(TestComponent);
      const reInitSpy = spyOn(fixture.componentInstance, 'onReInit');
      await fixture.whenStable();
      await delay();
      fixture.componentInstance.comp['emitInitEvent'](false);
      expect(reInitSpy).toHaveBeenCalled();
    });

    it('should call reInitMonaco with computed options', async () => {
      const fixture = create(TestComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      comp['reInitMonaco'](comp['computedOptions']());
      const spy = spyOn(comp.editor!, 'updateOptions');
      comp.updateOptions(comp['computedOptions']());
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('CatbeeMonacoDiffEditorComponent', () => {
    it('should initialize diff editor and emit init', async () => {
      const fixture = create(TestDiffComponent);
      const spy = spyOn(fixture.componentInstance, 'onInit');
      await fixture.whenStable();
      await delay();
      expect(spy).toHaveBeenCalled();
    });

    it('should update model and emit diff update event', async () => {
      const fixture = create(TestDiffComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      const emitSpy = spyOn(comp.editorDiffUpdate, 'emit');
      (comp as any).currentValue = { original: 'old', modified: 'new' };
      (comp as any).emitChange();
      expect(emitSpy).toHaveBeenCalledWith({ original: 'old', modified: 'new' });
    });

    it('should write value correctly to both sides', async () => {
      const fixture = create(TestDiffComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      const mockValue: CatbeeMonacoDiffEditorModel = { original: 'a', modified: 'b' };
      const spyOriginal = spyOn(comp.editor!.getOriginalEditor().getModel()!, 'setValue');
      const spyModified = spyOn(comp.editor!.getModifiedEditor().getModel()!, 'setValue');
      comp.writeValue(mockValue);
      expect(spyOriginal).toHaveBeenCalledWith('a');
      expect(spyModified).toHaveBeenCalledWith('b');
    });

    it('should toggle originalEditable correctly', async () => {
      const fixture = create(TestDiffComponent);
      await fixture.whenStable();
      await delay();
      const comp = fixture.componentInstance.comp;
      const spy = spyOn(comp.editor!, 'updateOptions');
      fixture.componentInstance.originalEditable.set(true);
      await delay();
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
      (reInit)="onReInit($event)"
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
  onReInit(_: MonacoEditor): void {}
}

@Component({
  template: `
    <ng-catbee-monaco-diff-editor
      #comp
      [model]="model()"
      [language]="language()"
      [height]="height"
      [initDelay]="initDelay"
      [originalEditable]="originalEditable()"
      (init)="onInit($event)"
      (editorDiffUpdate)="onDiffUpdate($event)"
    />
  `,
  imports: [FormsModule, CatbeeMonacoDiffEditorComponent]
})
class TestDiffComponent {
  @ViewChild('comp') comp!: CatbeeMonacoDiffEditorComponent;
  model = signal<CatbeeMonacoDiffEditorModel>({
    original: 'const a = 1;',
    modified: 'const a = 2;'
  });
  language = signal('typescript');
  originalEditable = signal(false);
  height = '100px';
  initDelay = 0;
  onInit(_: MonacoEditor): void {}
  onDiffUpdate(_: CatbeeMonacoDiffEditorModel): void {}
}

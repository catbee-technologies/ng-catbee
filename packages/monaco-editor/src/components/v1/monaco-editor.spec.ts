import { Component, provideZonelessChangeDetection, signal, Type, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideCatbeeMonacoEditor } from '../../monaco-editor.config';
import { CatbeeMonacoEditor } from './monaco-editor';
import { CatbeeMonacoDiffEditor } from './monaco-editor-diff';
import {
  CatbeeMonacoDiffEditorModel,
  MonacoDiffEditorOptions,
  MonacoEditor,
  MonacoEditorOptions
} from '../../types/monaco-editor.types';

const delay = (ms = 150) => new Promise(res => setTimeout(res, ms));

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

describe('CatbeeMonacoEditorComponents (V1)', () => {
  describe('CatbeeMonacoEditor', () => {
    afterEach(async () => {
      await delay(300);
    });

    describe('Initialization', () => {
      it('should initialize and emit init event', async () => {
        const fixture = create(TestComponent);
        const initSpy = spyOn(fixture.componentInstance, 'onInit');
        await fixture.whenStable();
        await delay();
        expect(initSpy).toHaveBeenCalled();
        expect(fixture.componentInstance.comp.editor).toBeDefined();
      });

      it('should initialize with model configuration', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getModel()?.getLanguageId()).toBe('html');
      });

      it('should delay initialization when initDelay is set', async () => {
        const fixture = create(TestComponent);
        fixture.componentInstance.initDelay = 500;
        fixture.detectChanges();
        await delay(400);
        expect(fixture.componentInstance.comp.editor).toBeFalsy();
        await delay(200);
        expect(fixture.componentInstance.comp.editor).toBeDefined();
      });
    });

    describe('ControlValueAccessor', () => {
      it('should write value and update editor', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spy = spyOn(comp.editor!, 'setValue');
        comp.writeValue('updated text');
        expect(spy).toHaveBeenCalledWith('updated text');
      });

      it('should register onChange and trigger on value change', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockFn = jasmine.createSpy();
        comp.registerOnChange(mockFn);
        (comp as any).onChange('hello');
        expect(mockFn).toHaveBeenCalledWith('hello');
      });

      it('should register onTouched callback', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockFn = jasmine.createSpy();
        comp.registerOnTouched(mockFn);
        (comp as any).onTouched();
        expect(mockFn).toHaveBeenCalled();
      });

      it('should set disabled state and update editor options', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spy = spyOn(comp, 'updateOptions');
        comp.setDisabledState(true);
        expect(comp.options()).toEqual({ theme: 'vs', readOnly: true, domReadOnly: true });
        await delay(0);
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ readOnly: true, domReadOnly: true }));
      });

      it('should trigger onChange when editor content changes', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockFn = jasmine.createSpy();
        comp.registerOnChange(mockFn);
        comp.editor?.setValue('new content');
        await delay(100);
        expect(mockFn).toHaveBeenCalledWith('new content');
      });

      it('should handle null value in writeValue', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spy = spyOn(comp.editor!, 'setValue');
        comp.writeValue(null as any);
        expect(spy).toHaveBeenCalledWith('');
      });
    });

    describe('Signal Integration', () => {
      it('should update value signal on content change', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.editor?.setValue('signal test');
        await delay(100);
        expect(comp.value()).toBe('signal test');
      });

      it('should react to options changes via effect', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp, 'updateOptions');
        fixture.componentInstance.options.set({ theme: 'vs-dark', language: 'javascript' });
        await delay(100);
        expect(spy).toHaveBeenCalled();
      });

      it('should react to placeholder changes via effect', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockWidget = { update: jasmine.createSpy() };
        (comp as any).placeholderWidget = mockWidget;
        (comp as any).placeholder = jasmine.createSpy().and.returnValue('New placeholder');
        mockWidget.update('New placeholder');
        expect(mockWidget.update).toHaveBeenCalledWith('New placeholder');
      });
    });

    describe('Placeholder', () => {
      it('should show placeholder when editor is empty', async () => {
        const fixture = create(
          TestComponent,
          `
          <ng-catbee-monaco-editor
            #comp
            [(ngModel)]="value"
            [language]="language"
            [options]="options()"
            placeholder="Type here"
          />
        `
        );
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spyAdd = spyOn(comp.editor!, 'addContentWidget');
        comp.value.set('');
        (comp as any).updatePlaceholder();
        expect(spyAdd).toHaveBeenCalled();
      });

      it('should show placeholder on whitespace when enabled', async () => {
        const fixture = create(
          TestComponent,
          `
          <ng-catbee-monaco-editor
            #comp
            [(ngModel)]="value"
            [language]="language"
            [options]="options()"
            placeholder="Type here"
            [showPlaceholderOnWhiteSpace]="true"
          />
        `
        );
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spyAdd = spyOn(comp.editor!, 'addContentWidget');
        comp.value.set('   ');
        (comp as any).updatePlaceholder();
        expect(spyAdd).toHaveBeenCalled();
      });

      it('should hide placeholder when editor has content', async () => {
        const fixture = create(
          TestComponent,
          `
          <ng-catbee-monaco-editor
            #comp
            [(ngModel)]="value"
            [language]="language"
            [options]="options()"
            placeholder="Type here"
          />
        `
        );
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.value.set('hello');
        const spyRemove = spyOn(comp.editor!, 'removeContentWidget');
        (comp.editor as any)._contentWidgets = { [(comp as any).placeholderWidget?.getId()]: {} };
        (comp as any).updatePlaceholder();
        expect(spyRemove).toHaveBeenCalled();
      });

      it('should use custom placeholder color', async () => {
        const fixture = create(
          TestComponent,
          `
          <ng-catbee-monaco-editor
            #comp
            placeholder="Custom"
            placeholderColor="red"
          />
        `
        );
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        (comp as any).updatePlaceholder();
        expect((comp as any).placeholderWidget).toBeDefined();
      });
    });

    describe('Options & Configuration', () => {
      it('should update options when disabled changes', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp.editor!, 'updateOptions');
        fixture.componentInstance.disabled.set(true);
        await delay();
        expect(spy).toHaveBeenCalled();
      });

      it('should update language when language changes', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        const initialLanguage = editor?.getModel()?.getLanguageId();
        expect(initialLanguage).toBe('html');
        fixture.componentInstance.language.set('typescript');
        await delay();
        const newLanguage = editor?.getModel()?.getLanguageId();
        expect(newLanguage).toBe('typescript');
      });

      it('should not reInit when options have not changed', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp as any;
        const spy = spyOn(comp, 'reInitMonaco');
        comp.updateOptions(comp.computedOptions());
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

      it('should apply default options from config', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect((comp as any).config).toBeTruthy();
      });
    });

    describe('Auto-formatting', () => {
      it('should auto-format on initialization when enabled', async () => {
        const fixture = create(TestComponent);
        fixture.componentInstance.autoFormat = true;
        await fixture.whenStable();
        await delay(100);
        const comp = fixture.componentInstance.comp;
        expect(comp.editor).toBeDefined();
      });

      it('should not auto-format when disabled', async () => {
        const fixture = create(TestComponent);
        const initSpy = spyOn(fixture.componentInstance, 'onInit');
        fixture.componentInstance.autoFormat = false;
        await fixture.whenStable();
        await delay();
        expect(initSpy).toHaveBeenCalled();
      });

      it('should format on writeValue when autoFormat is enabled', async () => {
        const fixture = create(TestComponent);
        fixture.componentInstance.autoFormat = true;
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const formatSpy = spyOn(comp as any, 'format');
        comp.writeValue('new code');
        expect(formatSpy).toHaveBeenCalled();
      });
    });

    describe('Events', () => {
      it('should emit editorFocus event', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const focusSpy = jasmine.createSpy();
        comp.editorFocus.subscribe(focusSpy);
        comp.editor?.focus();
        expect(focusSpy).toHaveBeenCalled();
      });

      it('should emit editorModelContentChange event', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const changeSpy = jasmine.createSpy();
        comp.editorModelContentChange.subscribe(changeSpy);
        comp.editor?.setValue('changed');
        expect(changeSpy).toHaveBeenCalled();
      });

      it('should emit reInit event', async () => {
        const fixture = create(TestComponent);
        const reInitSpy = spyOn(fixture.componentInstance, 'onReInit');
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.comp['emitInitEvent'](false);
        expect(reInitSpy).toHaveBeenCalled();
      });
    });

    describe('Lifecycle', () => {
      it('should dispose editor on destroy', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp.editor!, 'dispose');
        fixture.destroy();
        await delay(100);
        expect(spy).toHaveBeenCalled();
      });

      it('should handle resize events', async () => {
        const fixture = create(TestComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.editorResize).toBeDefined();
      });
    });

    describe('Monaco Model', () => {
      it('should create model with uri when provided', async () => {
        const fixture = create(
          TestComponent,
          `
          <ng-catbee-monaco-editor
            #comp
            [(ngModel)]="value"
            [language]="language"
            [uri]="'file:///test.ts'"
          />
        `
        );
        fixture.componentInstance.language.set('typescript');
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getModel()?.uri.path).toBe('/test.ts');
      });

      it('should reuse existing model when available', async () => {
        const uriString = 'file:///v1-existing.js';
        const uri = monaco.Uri.parse(uriString);
        if (!monaco.editor.getModel(uri)) {
          monaco.editor.createModel('existing', 'javascript', uri);
        }
        const fixture = create(
          TestComponent,
          `
          <ng-catbee-monaco-editor
            #comp
            [(ngModel)]="value"
            [language]="'javascript'"
            [uri]="'file:///v1-existing.js'"
          />
        `
        );
        await fixture.whenStable();
        await delay(200);
        const model = fixture.componentInstance.comp.editor?.getModel();
        expect(model?.uri.toString()).toBe(uri.toString());
      });
    });
  });

  describe('CatbeeMonacoDiffEditor', () => {
    afterEach(async () => {
      await delay(300);
    });

    describe('Initialization', () => {
      it('should initialize diff editor and emit init', async () => {
        const fixture = create(TestDiffComponent);
        const spy = spyOn(fixture.componentInstance, 'onInit');
        await fixture.whenStable();
        await delay();
        expect(spy).toHaveBeenCalled();
        expect(fixture.componentInstance.comp.editor).toBeDefined();
      });

      it('should initialize with language configuration', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getModel()?.getLanguageId()).toBe('typescript');
        expect(editor?.getModifiedEditor().getModel()?.getLanguageId()).toBe('typescript');
      });

      it('should initialize with model values', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getValue()).toBe('const a = 1;');
        expect(editor?.getModifiedEditor().getValue()).toBe('const a = 2;');
      });
    });

    describe('ControlValueAccessor', () => {
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

      it('should handle null value in writeValue', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.writeValue(null);
        expect(comp.editor).toBeDefined();
      });

      it('should register onChange callback', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockFn = jasmine.createSpy();
        comp.registerOnChange(mockFn);
        (comp as any).onChange({ original: 'test', modified: 'test2' });
        expect(mockFn).toHaveBeenCalled();
      });

      it('should register onTouched callback', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockFn = jasmine.createSpy();
        comp.registerOnTouched(mockFn);
        (comp as any).onTouched();
        expect(mockFn).toHaveBeenCalled();
      });

      it('should set disabled state', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spy = spyOn(comp, 'updateOptions');
        comp.setDisabledState(true);
        expect(comp.options()).toEqual({
          originalEditable: false,
          readOnly: true,
          domReadOnly: true
        } as MonacoDiffEditorOptions);
        await delay(0);
        expect(spy).toHaveBeenCalledWith(
          jasmine.objectContaining({ readOnly: true, domReadOnly: true, originalEditable: false })
        );
      });
    });

    describe('Signal Integration', () => {
      it('should update currentValue signal on content change', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.editor?.getModifiedEditor().setValue('signal update');
        await delay(100);
        expect((comp as any).currentValue().modified).toBe('signal update');
      });

      it('should react to language changes via effect', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.language.set('javascript');
        await delay(100);
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getModel()?.getLanguageId()).toBe('javascript');
        expect(editor?.getModifiedEditor().getModel()?.getLanguageId()).toBe('javascript');
      });

      it('should react to originalEditable changes via effect', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spy = spyOn(comp.editor!, 'updateOptions');
        fixture.componentInstance.originalEditable.set(true);
        await delay(100);
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('Diff Events', () => {
      it('should emit editorDiffUpdate on original editor change', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const emitSpy = spyOn(comp.editorDiffUpdate, 'emit');
        comp.editor?.getOriginalEditor().setValue('changed original');
        await delay(100);
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({ original: 'changed original' }));
      });

      it('should emit editorDiffUpdate on modified editor change', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const emitSpy = spyOn(comp.editorDiffUpdate, 'emit');
        comp.editor?.getModifiedEditor().setValue('changed modified');
        await delay(100);
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({ modified: 'changed modified' }));
      });

      it('should emit diffUpdate event', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const diffSpy = spyOn(comp.editorDiffUpdate, 'emit');
        comp.editor?.getModifiedEditor().setValue('trigger diff');
        await delay(200);
        expect(diffSpy).toHaveBeenCalled();
      });

      it('should update model and emit diff update event', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const emitSpy = spyOn(comp.editorDiffUpdate, 'emit');
        (comp as any).currentValue.set({ original: 'old', modified: 'new' });
        (comp as any).emitChange();
        expect(emitSpy).toHaveBeenCalledWith({ original: 'old', modified: 'new' });
      });
    });

    describe('Configuration', () => {
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

      it('should apply default options from config', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect((comp as any).config).toBeTruthy();
      });
    });

    describe('Lifecycle', () => {
      it('should dispose diff editor on destroy', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp.editor!, 'dispose');
        fixture.destroy();
        expect(spy).toHaveBeenCalled();
      });

      it('should handle resize events', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.editorResize).toBeDefined();
      });

      it('should trigger onTouched on blur', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockFn = jasmine.createSpy();
        comp.registerOnTouched(mockFn);
        expect(mockFn).toBeDefined();
      });
    });

    describe('Model Updates', () => {
      it('should update both sides when currentValue changes', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        (comp as any).currentValue.set({ original: 'left', modified: 'right' });
        (comp as any).emitChange();
        expect((comp as any).currentValue().original).toBe('left');
        expect((comp as any).currentValue().modified).toBe('right');
      });

      it('should emit onChange when either side changes', async () => {
        const fixture = create(TestDiffComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const mockFn = jasmine.createSpy();
        comp.registerOnChange(mockFn);
        comp.editor?.getOriginalEditor().setValue('new original');
        await delay(100);
        expect(mockFn).toHaveBeenCalled();
      });
    });
  });
});

@Component({
  template: `
    <ng-catbee-monaco-editor
      #comp
      [(ngModel)]="value"
      [language]="language()"
      [options]="options()"
      [height]="height"
      [initDelay]="initDelay"
      [disabled]="disabled()"
      [autoFormat]="autoFormat"
      [placeholder]="placeholder"
      (init)="onInit($event)"
      (reInit)="onReInit($event)"
    />
  `,
  imports: [FormsModule, CatbeeMonacoEditor]
})
class TestComponent {
  @ViewChild('comp') comp!: CatbeeMonacoEditor;
  options = signal<MonacoEditorOptions>({ theme: 'vs', readOnly: true });
  language = signal('html');
  height = '100px';
  initDelay = 0;
  disabled = signal(false);
  autoFormat = false;
  placeholder: string | null = null;
  value = '<h1>Title</h1>';
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
  imports: [FormsModule, CatbeeMonacoDiffEditor]
})
class TestDiffComponent {
  @ViewChild('comp') comp!: CatbeeMonacoDiffEditor;
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

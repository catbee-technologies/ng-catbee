import { Component, provideZonelessChangeDetection, signal, Type, ViewChild, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCatbeeMonacoEditor } from '../../monaco-editor.config';
import { CatbeeMonacoEditorV2 } from './monaco-editor';
import { CatbeeMonacoDiffEditorV2 } from './monaco-editor-diff';
import {
  CatbeeMonacoDiffEditorModel,
  MonacoEditor,
  MonacoDiffEditor,
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
    imports: [TestEditorComponent, TestDiffEditorComponent]
  });
  if (html != null) TestBed.overrideTemplate(comp, html);
  return TestBed.createComponent(comp);
}

describe('CatbeeMonacoEditorComponents (V2 - Signal Forms)', () => {
  describe('CatbeeMonacoEditorV2', () => {
    afterEach(async () => {
      await delay(300);
    });

    describe('Initialization', () => {
      it('should initialize and emit init event', async () => {
        const fixture = create(TestEditorComponent);
        const initSpy = spyOn(fixture.componentInstance, 'onInit');
        await fixture.whenStable();
        await delay();
        expect(initSpy).toHaveBeenCalled();
        expect(fixture.componentInstance.comp.editor).toBeDefined();
      });

      it('should initialize with model configuration', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getModel()?.getLanguageId()).toBe('typescript');
      });

      it('should delay initialization when initDelay is set', async () => {
        const fixture = create(TestEditorComponent);
        fixture.componentInstance.initDelay = 500;
        fixture.detectChanges();
        await delay(400);
        expect(fixture.componentInstance.comp.editor).toBeFalsy();
        await delay(200);
        expect(fixture.componentInstance.comp.editor).toBeDefined();
      });

      it('should initialize with initial value', async () => {
        const fixture = create(TestEditorComponent);
        fixture.componentInstance.codeValue.set('initial code');
        await fixture.whenStable();
        await delay();
        expect(fixture.componentInstance.comp.editor?.getValue()).toBe('initial code');
      });
    });

    describe('FormValueControl Interface', () => {
      it('should expose value signal', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.value).toBeDefined();
        expect(typeof comp.value).toBe('function');
      });

      it('should update value signal on content change', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.editor?.setValue('new value');
        await delay(100);
        expect(comp.value()).toBe('new value');
      });

      it('should expose touched signal', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.touched).toBeDefined();
        expect(comp.touched()).toBe(false);
      });

      it('should set touched on blur', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.touched.set(true);
        expect(comp.touched()).toBe(true);
      });

      it('should expose disabled input signal', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.disabled()).toBe(false);
      });
    });

    describe('Two-way Value Binding', () => {
      it('should bind value with model signal', async () => {
        const fixture = create(TestEditorComponent);
        fixture.componentInstance.codeValue.set('test code');
        await fixture.whenStable();
        await delay();
        expect(fixture.componentInstance.comp.editor?.getValue()).toBe('test code');
      });

      it('should update external signal when editor value changes', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.comp.editor?.setValue('updated externally');
        await delay(100);
        expect(fixture.componentInstance.codeValue()).toBe('updated externally');
      });

      it('should sync editor when external signal changes', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.codeValue.set('external change');
        await delay(100);
        expect(fixture.componentInstance.comp.editor?.getValue()).toBe('external change');
      });
    });

    describe('Signal Reactivity', () => {
      it('should react to options changes via effect', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp, 'updateOptions');
        fixture.componentInstance.options.set({ theme: 'vs-light', language: 'javascript' });
        fixture.detectChanges();
        await delay(100);
        expect(spy).toHaveBeenCalled();
      });

      it('should react to placeholder changes via effect', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        (comp as any).placeholderWidget = { update: jasmine.createSpy() };
        fixture.componentInstance.placeholderText.set('New placeholder');
        fixture.detectChanges();
        await delay(100);
        expect((comp as any).placeholderWidget.update).toHaveBeenCalledWith('New placeholder');
      });

      it('should react to value signal changes from form', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.value.set('from form');
        await delay(100);
        expect(comp.editor?.getValue()).toBe('from form');
      });
    });

    describe('Placeholder', () => {
      it('should show placeholder when editor is empty', async () => {
        const fixture = create(
          TestEditorComponent,
          `
          <ng-catbee-monaco-editor-v2
            #comp
            [(value)]="codeValue"
            [placeholder]="placeholderText()"
          />
        `
        );
        fixture.componentInstance.placeholderText.set('Type here');
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spyAdd = spyOn(comp.editor!, 'addContentWidget');
        comp.value.set('');
        await delay(100);
        expect(spyAdd).toHaveBeenCalled();
      });

      it('should hide placeholder when editor has content', async () => {
        const fixture = create(
          TestEditorComponent,
          `
          <ng-catbee-monaco-editor-v2
            #comp
            [(value)]="codeValue"
            [placeholder]="placeholderText()"
          />
        `
        );
        fixture.componentInstance.placeholderText.set('Type here');
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.value.set('hello');
        const spyRemove = spyOn(comp.editor!, 'removeContentWidget');
        (comp.editor as any)._contentWidgets = { [(comp as any).placeholderWidget?.getId()]: {} };
        await delay(100);
        expect(spyRemove).toHaveBeenCalled();
      });

      it('should show placeholder on whitespace when enabled', async () => {
        const fixture = create(
          TestEditorComponent,
          `
          <ng-catbee-monaco-editor-v2
            #comp
            [(value)]="codeValue"
            [placeholder]="placeholderText()"
            [showPlaceholderOnWhiteSpace]="true"
          />
        `
        );
        fixture.componentInstance.placeholderText.set('Type here');
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spyAdd = spyOn(comp.editor!, 'addContentWidget');
        comp.value.set('   ');
        await delay(100);
        expect(spyAdd).toHaveBeenCalled();
      });
    });

    describe('Auto-formatting', () => {
      it('should auto-format on initialization when enabled', async () => {
        const fixture = create(TestEditorComponent);
        fixture.componentInstance.autoFormat.set(true);
        await fixture.whenStable();
        await delay(100);
        const comp = fixture.componentInstance.comp;
        expect(comp.editor).toBeDefined();
      });

      it('should not auto-format when disabled', async () => {
        const fixture = create(TestEditorComponent);
        const initSpy = spyOn(fixture.componentInstance, 'onInit');
        fixture.componentInstance.autoFormat.set(false);
        await fixture.whenStable();
        await delay();
        expect(initSpy).toHaveBeenCalled();
      });

      it('should format on value change when autoFormat is enabled', async () => {
        const fixture = create(TestEditorComponent);
        fixture.componentInstance.autoFormat.set(true);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.value.set('function test() { return true; }');
        await delay(100);
        expect(comp.editor?.getValue()).toContain('function test()');
      });
    });

    describe('Events', () => {
      it('should emit editorFocus event', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const focusSpy = jasmine.createSpy();
        comp.editorFocus.subscribe(focusSpy);
        comp.editor?.focus();
        expect(focusSpy).toHaveBeenCalled();
      });

      it('should emit editorBlur event', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const blurSpy = jasmine.createSpy();
        comp.editorBlur.subscribe(blurSpy);
        expect(comp.editorBlur).toBeDefined();
      });

      it('should emit editorModelContentChange event', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const changeSpy = jasmine.createSpy();
        comp.editorModelContentChange.subscribe(changeSpy);
        comp.editor?.setValue('changed');
        expect(changeSpy).toHaveBeenCalled();
      });

      it('should emit reInit event', async () => {
        const fixture = create(TestEditorComponent);
        const reInitSpy = spyOn(fixture.componentInstance, 'onReInit');
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.comp['emitInitEvent'](false);
        expect(reInitSpy).toHaveBeenCalled();
      });

      it('should emit cursor position change event', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const cursorSpy = jasmine.createSpy();
        comp.editorCursorPositionChange.subscribe(cursorSpy);
        comp.editor?.setPosition({ lineNumber: 1, column: 5 });
        expect(cursorSpy).toHaveBeenCalled();
      });
    });

    describe('Options & Configuration', () => {
      it('should update options when disabled changes', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp.editor!, 'updateOptions');
        fixture.componentInstance.isDisabled.set(true);
        await delay();
        expect(spy).toHaveBeenCalled();
      });

      it('should update language when language changes', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        const initialLanguage = editor?.getModel()?.getLanguageId();
        expect(initialLanguage).toBe('typescript');
        fixture.componentInstance.language.set('json');
        await delay();
        const newLanguage = editor?.getModel()?.getLanguageId();
        expect(newLanguage).toBe('json');
      });

      it('should apply default options from config', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect((comp as any).config).toBeTruthy();
      });

      it('should apply readOnly when disabled', async () => {
        const fixture = create(TestEditorComponent);
        fixture.componentInstance.isDisabled.set(true);
        await fixture.whenStable();
        await delay();
        expect(fixture.componentInstance.comp.disabled()).toBe(true);
      });
    });

    describe('Lifecycle', () => {
      it('should dispose editor on destroy', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp.editor!, 'dispose');
        fixture.destroy();
        expect(spy).toHaveBeenCalled();
      });

      it('should handle resize events', async () => {
        const fixture = create(TestEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.editorResize).toBeDefined();
      });
    });

    describe('Monaco Model', () => {
      it('should create model with uri when provided', async () => {
        const fixture = create(
          TestEditorComponent,
          `
          <ng-catbee-monaco-editor-v2
            #comp
            [(value)]="codeValue"
            [language]="language()"
            [uri]="'file:///test.ts'"
          />
        `
        );
        fixture.componentInstance.language.set('typescript');
        fixture.componentInstance.codeValue.set('test');
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getModel()?.uri.path).toBe('/test.ts');
      });

      it('should reuse existing model when available', async () => {
        const uriString = 'file:///v2-existing.js';
        const uri = monaco.Uri.parse(uriString);
        if (!monaco.editor.getModel(uri)) {
          monaco.editor.createModel('existing', 'javascript', uri);
        }
        const fixture = create(
          TestEditorComponent,
          `
          <ng-catbee-monaco-editor-v2
            #comp
            [(value)]="codeValue"
            [language]="language()"
            [uri]="'file:///v2-existing.js'"
          />
        `
        );
        fixture.componentInstance.language.set('javascript');
        await fixture.whenStable();
        await delay(200);
        const model = fixture.componentInstance.comp.editor?.getModel();
        expect(model?.uri.toString()).toBe(uri.toString());
      });
    });
  });

  describe('CatbeeMonacoDiffEditorV2', () => {
    afterEach(async () => {
      await delay(300);
    });

    describe('Initialization', () => {
      it('should initialize diff editor and emit init', async () => {
        const fixture = create(TestDiffEditorComponent);
        const spy = spyOn(fixture.componentInstance, 'onInit');
        await fixture.whenStable();
        await delay();
        expect(spy).toHaveBeenCalled();
        expect(fixture.componentInstance.comp.editor).toBeDefined();
      });

      it('should initialize with language configuration', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getModel()?.getLanguageId()).toBe('typescript');
        expect(editor?.getModifiedEditor().getModel()?.getLanguageId()).toBe('typescript');
      });

      it('should initialize with diff values', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getValue()).toBe('const a = 1;');
        expect(editor?.getModifiedEditor().getValue()).toBe('const a = 2;');
      });
    });

    describe('FormValueControl Interface', () => {
      it('should expose value signal with diff model', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.value).toBeDefined();
        expect(comp.value()).toEqual(
          jasmine.objectContaining({ original: jasmine.any(String), modified: jasmine.any(String) })
        );
      });

      it('should update value signal on original editor change', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.editor?.getOriginalEditor().setValue('changed original');
        await delay(100);
        expect(comp.value().original).toBe('changed original');
      });

      it('should update value signal on modified editor change', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.editor?.getModifiedEditor().setValue('changed modified');
        await delay(100);
        expect(comp.value().modified).toBe('changed modified');
      });

      it('should expose touched signal', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.touched).toBeDefined();
        expect(comp.touched()).toBe(false);
      });

      it('should set touched on blur', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.touched.set(true);
        expect(comp.touched()).toBe(true);
      });

      it('should expose disabled input signal', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.disabled()).toBe(false);
      });
    });

    describe('Two-way Value Binding', () => {
      it('should bind value with model signal', async () => {
        const fixture = create(TestDiffEditorComponent);
        fixture.componentInstance.diffValue.set({ original: 'left', modified: 'right' });
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getValue()).toBe('left');
        expect(editor?.getModifiedEditor().getValue()).toBe('right');
      });

      it('should update external signal when editor value changes', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.comp.editor?.getModifiedEditor().setValue('updated');
        await delay(100);
        expect(fixture.componentInstance.diffValue().modified).toBe('updated');
      });

      it('should sync editor when external signal changes', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.diffValue.set({ original: 'ext1', modified: 'ext2' });
        await delay(100);
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getValue()).toBe('ext1');
        expect(editor?.getModifiedEditor().getValue()).toBe('ext2');
      });
    });

    describe('Signal Reactivity', () => {
      it('should react to language changes via effect', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        fixture.componentInstance.language.set('javascript');
        await delay(100);
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getModel()?.getLanguageId()).toBe('javascript');
        expect(editor?.getModifiedEditor().getModel()?.getLanguageId()).toBe('javascript');
      });

      it('should react to originalEditable changes via effect', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spy = spyOn(comp.editor!, 'updateOptions');
        fixture.componentInstance.originalEditable.set(true);
        await delay(100);
        expect(spy).toHaveBeenCalled();
      });

      it('should react to value signal changes from form', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.value.set({ original: 'from form 1', modified: 'from form 2' });
        await delay(100);
        expect(comp.editor?.getOriginalEditor().getValue()).toBe('from form 1');
        expect(comp.editor?.getModifiedEditor().getValue()).toBe('from form 2');
      });
    });

    describe('Diff Events', () => {
      it('should emit editorDiffUpdate on original editor change', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const emitSpy = spyOn(comp.editorDiffUpdate, 'emit');
        comp.editor?.getOriginalEditor().setValue('changed original');
        await delay(100);
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({ original: 'changed original' }));
      });

      it('should emit editorDiffUpdate on modified editor change', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const emitSpy = spyOn(comp.editorDiffUpdate, 'emit');
        comp.editor?.getModifiedEditor().setValue('changed modified');
        await delay(100);
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({ modified: 'changed modified' }));
      });

      it('should emit diffUpdate event', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const diffSpy = spyOn(comp.editorDiffUpdate, 'emit');
        comp.editor?.getModifiedEditor().setValue('trigger diff');
        await delay(200);
        expect(diffSpy).toHaveBeenCalled();
      });
    });

    describe('Configuration', () => {
      it('should toggle originalEditable correctly', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        const spy = spyOn(comp.editor!, 'updateOptions');
        fixture.componentInstance.originalEditable.set(true);
        await delay();
        expect(spy).toHaveBeenCalled();
      });

      it('should apply readOnly when disabled', async () => {
        const fixture = create(TestDiffEditorComponent);
        fixture.componentInstance.isDisabled.set(true);
        await fixture.whenStable();
        await delay();
        expect(fixture.componentInstance.comp.disabled()).toBe(true);
      });

      it('should apply default options from config', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect((comp as any).config).toBeTruthy();
      });
    });

    describe('Lifecycle', () => {
      it('should dispose diff editor on destroy', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const spy = spyOn(fixture.componentInstance.comp.editor!, 'dispose');
        fixture.destroy();
        expect(spy).toHaveBeenCalled();
      });

      it('should handle resize events', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        expect(comp.editorResize).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty diff values', async () => {
        const fixture = create(TestDiffEditorComponent);
        fixture.componentInstance.diffValue.set({ original: '', modified: '' });
        await fixture.whenStable();
        await delay();
        const editor = fixture.componentInstance.comp.editor;
        expect(editor?.getOriginalEditor().getValue()).toBe('');
        expect(editor?.getModifiedEditor().getValue()).toBe('');
      });

      it('should handle undefined in diff model', async () => {
        const fixture = create(TestDiffEditorComponent);
        await fixture.whenStable();
        await delay();
        const comp = fixture.componentInstance.comp;
        comp.value.set({ original: undefined as any, modified: undefined as any });
        await delay(100);
        expect(comp.editor?.getOriginalEditor().getValue()).toBe('');
        expect(comp.editor?.getModifiedEditor().getValue()).toBe('');
      });
    });
  });
});

@Component({
  template: `
    <ng-catbee-monaco-editor-v2
      #comp
      [(value)]="codeValue"
      [language]="language()"
      [options]="options()"
      [height]="height"
      [initDelay]="initDelay"
      [disabled]="isDisabled()"
      [autoFormat]="autoFormat()"
      [placeholder]="placeholderText()"
      (init)="onInit($event)"
      (reInit)="onReInit($event)"
    />
  `,
  imports: [CatbeeMonacoEditorV2]
})
class TestEditorComponent {
  @ViewChild('comp') comp!: CatbeeMonacoEditorV2;
  codeValue: WritableSignal<string> = signal('console.log("test");');
  language = signal('typescript');
  options = signal<MonacoEditorOptions>({ theme: 'vs-dark' });
  height = '400px';
  initDelay = 0;
  isDisabled = signal(false);
  autoFormat = signal(false);
  placeholderText = signal<string | null>(null);
  onInit(_: MonacoEditor): void {}
  onReInit(_: MonacoEditor): void {}
}

@Component({
  template: `
    <ng-catbee-monaco-diff-editor-v2
      #comp
      [(value)]="diffValue"
      [language]="language()"
      [height]="height"
      [initDelay]="initDelay"
      [originalEditable]="originalEditable()"
      [disabled]="isDisabled()"
      (init)="onInit($event)"
      (editorDiffUpdate)="onDiffUpdate($event)"
    />
  `,
  imports: [CatbeeMonacoDiffEditorV2]
})
class TestDiffEditorComponent {
  @ViewChild('comp') comp!: CatbeeMonacoDiffEditorV2;
  diffValue: WritableSignal<CatbeeMonacoDiffEditorModel> = signal({
    original: 'const a = 1;',
    modified: 'const a = 2;'
  });
  language = signal('typescript');
  originalEditable = signal(false);
  height = '400px';
  initDelay = 0;
  isDisabled = signal(false);
  onInit(_: MonacoDiffEditor): void {}
  onDiffUpdate(_: CatbeeMonacoDiffEditorModel): void {}
}

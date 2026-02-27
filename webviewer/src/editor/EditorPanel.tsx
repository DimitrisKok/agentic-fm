import { useRef, useEffect, useState } from 'preact/hooks';
import * as monaco from 'monaco-editor';
import { registerFileMakerLanguage, attachDiagnostics, LANGUAGE_ID } from './language/filemaker-script';
import { fetchSteps } from '@/api/client';
import type { FMContext } from '@/context/types';

// Configure Monaco workers
self.MonacoEnvironment = {
  getWorker(_: unknown, _label: string) {
    return new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
      { type: 'module' },
    );
  },
};

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  context: FMContext | null;
}

export function EditorPanel({ value, onChange, context }: EditorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [stepNames, setStepNames] = useState<string[]>([]);

  // Fetch step names for autocomplete
  useEffect(() => {
    fetchSteps()
      .then(steps => setStepNames(steps.map(s => s.name)))
      .catch(() => {
        // Step names not available — autocomplete won't have step suggestions
      });
  }, []);

  // Register language once step names are loaded
  useEffect(() => {
    registerFileMakerLanguage(stepNames.length > 0 ? stepNames : undefined);
  }, [stepNames]);

  // Create editor
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: LANGUAGE_ID,
      theme: 'filemaker-dark',
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 4,
      insertSpaces: true,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        indentation: true,
        bracketPairs: true,
      },
      padding: { top: 8, bottom: 8 },
    });

    editorRef.current = editor;

    // Listen for changes
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    // Attach diagnostics
    const diagDisposable = attachDiagnostics(editor, stepNames);

    return () => {
      diagDisposable.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, [containerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync value from parent (e.g. when loading a script)
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  // Update context-aware completions when context changes
  useEffect(() => {
    // Future: update completion providers with context data
    // (field references, layout names, script names, etc.)
  }, [context]);

  return (
    <div
      ref={containerRef}
      class="h-full w-full"
    />
  );
}

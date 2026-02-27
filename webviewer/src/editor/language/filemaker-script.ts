import * as monaco from 'monaco-editor';
import { monarchLanguage, languageConfiguration } from './monarch';
import { filemakerDarkTheme } from './theme';
import { createCompletionProvider } from './completion';
import { createDiagnosticsProvider } from './diagnostics';

const LANGUAGE_ID = 'filemaker-script';
let registered = false;

export function registerFileMakerLanguage(
  stepNames?: string[],
): void {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchLanguage);
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, languageConfiguration);

  monaco.editor.defineTheme('filemaker-dark', filemakerDarkTheme);

  if (stepNames) {
    monaco.languages.registerCompletionItemProvider(
      LANGUAGE_ID,
      createCompletionProvider(stepNames),
    );
  }
}

export function attachDiagnostics(
  editor: monaco.editor.IStandaloneCodeEditor,
  stepNames?: string[],
): monaco.IDisposable {
  return createDiagnosticsProvider(editor, stepNames ?? []);
}

export { LANGUAGE_ID };

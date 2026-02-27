import * as monaco from 'monaco-editor';

/**
 * Autocomplete provider for FileMaker script step names.
 * Sources step names from the /api/steps endpoint (snippet_examples enumeration).
 */
export function createCompletionProvider(
  stepNames: string[],
): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: [],

    provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position,
    ): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
      const lineContent = model.getLineContent(position.lineNumber);
      const lineUntilPosition = lineContent.substring(0, position.column - 1).trimStart();

      // Only suggest step names at the start of a line (before any bracket)
      if (lineUntilPosition.includes('[')) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = stepNames.map((name, i) => {
        const isControl = controlSteps.has(name);
        return {
          label: name,
          kind: isControl
            ? monaco.languages.CompletionItemKind.Keyword
            : monaco.languages.CompletionItemKind.Function,
          insertText: getInsertText(name),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: isControl ? 'Control flow' : 'Script step',
          sortText: String(i).padStart(4, '0'),
          range,
        };
      });

      return { suggestions };
    },
  };
}

const controlSteps = new Set([
  'If', 'Else If', 'Else', 'End If',
  'Loop', 'Exit Loop If', 'End Loop',
  'Exit Script', 'Halt Script',
]);

/** Generate snippet insert text with tab stops for common steps */
function getInsertText(name: string): string {
  switch (name) {
    case 'Set Variable':
      return 'Set Variable [ \\$$${1:varName} ; ${2:value} ]';
    case 'Set Field':
      return 'Set Field [ ${1:Table::Field} ; ${2:value} ]';
    case 'If':
      return 'If [ ${1:condition} ]\n\t$0\nEnd If';
    case 'Else If':
      return 'Else If [ ${1:condition} ]';
    case 'Loop':
      return 'Loop\n\t$0\nEnd Loop';
    case 'Exit Loop If':
      return 'Exit Loop If [ ${1:condition} ]';
    case 'Exit Script':
      return 'Exit Script [ Result: ${1:value} ]';
    case 'Go to Layout':
      return 'Go to Layout [ "${1:LayoutName}" ]';
    case 'Perform Script':
      return 'Perform Script [ "${1:ScriptName}" ; Parameter: ${2:value} ]';
    case 'Show Custom Dialog':
      return 'Show Custom Dialog [ "${1:Title}" ; "${2:Message}" ]';
    case 'Go to Object':
      return 'Go to Object [ Object Name: "${1:objectName}" ]';
    default:
      if (controlSteps.has(name)) return name;
      return `${name} [ $0 ]`;
  }
}

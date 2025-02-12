import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { checkSelectionIsValidStyle } from './helper';

export function activate(context: vscode.ExtensionContext) {
  // Register the Sidebar Panel
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  const subscriptions = [
    vscode.window.registerWebviewViewProvider('RNStylesCleaner-sidebar', sidebarProvider),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      sidebarProvider._editor = editor;
      sidebarProvider.getStyles();
      sidebarProvider.detectDuplicatedInlineStyles();
    }),
    vscode.workspace.onDidSaveTextDocument((event) => {
      sidebarProvider.getStyles();
      sidebarProvider.detectDuplicatedInlineStyles();
    }),
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor && vscode.window.activeTextEditor && event.textEditor.document === vscode.window.activeTextEditor.document) {
        const selection = sidebarProvider.getTextFromSelection();
        sidebarProvider.setSelection(selection);
      }
    }),
    vscode.commands.registerCommand('RNStylesCleaner.extractSelectionIntoStyleSheet', (newStyleName = '', rootStyle = '') => {
      if (sidebarProvider._editor?.selection.isEmpty) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }
      if (!checkSelectionIsValidStyle(sidebarProvider.selection)) {
        vscode.window.showErrorMessage('Invalid style selected');
        return;
      }
      sidebarProvider.handleExtractSelectionIntoStyleSheet(newStyleName, rootStyle);
    }),
    vscode.commands.registerCommand('RNStylesCleaner.removeUnusedStyles', () => {
      if (!sidebarProvider._editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
      }
      if (sidebarProvider.styleList.length === 0) {
        vscode.window.showErrorMessage('No styles found');
        return;
      }
      sidebarProvider.handleRemoveUnusedStyles(sidebarProvider._editor, sidebarProvider.styleList);
    }),
    vscode.commands.registerCommand('RNStylesCleaner.copyStylesFromSelection', () => {
      sidebarProvider.handleCopyStylesFromSelection();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('RNStylesCleaner')) {
        sidebarProvider.updateExtensionConfig();
      }
    }),
    vscode.commands.registerCommand('RNStylesCleaner.cleanStylesForFolder', (selectedDir: vscode.Uri | undefined) => {
      sidebarProvider.handleCleanStylesForFolder(selectedDir);
    }),

    vscode.commands.registerCommand('RNStylesCleaner.consolidateDuplicateInlineStyles', async () => {
      if (!sidebarProvider._editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
      }
      await sidebarProvider.consolidateInlineStyles();
    }),
  ];
  subscriptions.forEach((item) => context.subscriptions.push(item));
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { checkSelectionIsValidStyle } from './helper';

export function activate(context: vscode.ExtensionContext) {
  // Register the Sidebar Panel
  const sidebarProvider = new SidebarProvider(context.extensionUri);

  const subscriptions = [
    vscode.window.registerWebviewViewProvider('RNStylesCleaner-sidebar', sidebarProvider),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        sidebarProvider._editor = editor;
        sidebarProvider.getStyles();
      }
    }),
    vscode.workspace.onDidSaveTextDocument((event) => {
      sidebarProvider.getStyles();
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
      sidebarProvider.handleRemoveUnusedStyles();
    }),
    vscode.commands.registerCommand('RNStylesCleaner.copyStylesFromSelection', () => {
      sidebarProvider.handleCopyStylesFromSelection();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('RNStylesCleaner')) {
        sidebarProvider.updateExtensionConfig();
      }
    }),
  ];
  subscriptions.forEach((item) => context.subscriptions.push(item));
}

// this method is called when your extension is deactivated
export function deactivate() {}


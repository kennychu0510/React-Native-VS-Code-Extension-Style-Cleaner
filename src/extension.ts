import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';

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
    })
  ]
  subscriptions.forEach(item => context.subscriptions.push(item))

}

// this method is called when your extension is deactivated
export function deactivate() {}

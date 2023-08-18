import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  // Register the Sidebar Panel
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('stylesCleaner-sidebar', sidebarProvider));

  // Register a custom command
  // context.subscriptions.push(vscode.commands.registerCommand('stylesCleaner.commandname', () => {
  // 	// code here...
  // }));

  // context.subscriptions.push(
  //   vscode.commands.registerCommand('stylesCleaner.helloWorld', () => {
  //     vscode.window.showInformationMessage(`hello world from styles cleaner`);
  //   })
  // );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        sidebarProvider._editor = editor;
        sidebarProvider.getStyles();
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((event) => {
      sidebarProvider.getStyles();
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

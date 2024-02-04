import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs'
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

suite('Extract style into stylesheet', () => {
  test('Stylesheet contains at least one item', async () => {
    // Get the current workspace directory
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const filePath = path.join(workspaceFolder, 'file1.js');
    const beforeFile = fs.readFileSync(path.join(workspaceFolder, 'file1-before.js'), 'utf8');
    const afterFile = fs.readFileSync(path.join(workspaceFolder, 'file1-after.js'), 'utf8');

    // create new file named file1.js in the current workspace
    fs.writeFileSync(filePath, beforeFile, 'utf8');
    await vscode.commands.executeCommand('RNStylesCleaner-sidebar.focus')

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    
    await vscode.window.showTextDocument(document);

    await sleep(1000)

    // select line 6 col 11 to line 6 col 54
    const selection = new vscode.Selection(5, 10, 5, 53);
    vscode.window.activeTextEditor!.selection = selection;

    await sleep(2000)
    await vscode.commands.executeCommand('RNStylesCleaner.extractSelectionIntoStyleSheet', 'container');
    await sleep(1000)

    await vscode.commands.executeCommand('workbench.action.files.save');

    await sleep(1000)

    // get content of current file
    const currentFile = fs.readFileSync(filePath, 'utf8');

    // assert beforeFile not equal after file
    assert.strictEqual(currentFile, afterFile);
  });
});

//sleep function
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

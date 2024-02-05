import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

suite('Extract style into stylesheet', () => {
  test('Scenario 1: Stylesheet contains at least one item', async () => {
    const scenario = 'one-style';
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const filePath = path.join(workspaceFolder, scenario, 'working.js');
    const beforeFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'before.js'), 'utf8');
    const afterFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'after.js'), 'utf8');

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, 'utf8');

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('RNStylesCleaner-sidebar.focus');
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 6 col 11 to line 6 col 54
    const selection = new vscode.Selection(5, 10, 5, 53);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep(500);

    await vscode.commands.executeCommand('RNStylesCleaner.extractSelectionIntoStyleSheet', 'container');

    await vscode.commands.executeCommand('workbench.action.files.save');

    // get content of current file
    const currentFile = fs.readFileSync(filePath, 'utf8');

    // assert beforeFile not equal after file
    assert.strictEqual(currentFile, afterFile);
  });

  test('Scenario 2: No stylesheet', async () => {
    const scenario = 'no-style';
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const filePath = path.join(workspaceFolder, scenario, 'working.js');
    const beforeFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'before.js'), 'utf8');
    const afterFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'after.js'), 'utf8');

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, 'utf8');

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('RNStylesCleaner-sidebar.focus');
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 6 col 11 to line 6 col 54
    const selection = new vscode.Selection(5, 10, 5, 53);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep();

    await vscode.commands.executeCommand('RNStylesCleaner.extractSelectionIntoStyleSheet', 'container');

    await vscode.commands.executeCommand('workbench.action.files.save');

    // get content of current file
    const currentFile = fs.readFileSync(filePath, 'utf8');

    // assert beforeFile not equal after file
    assert.strictEqual(currentFile, afterFile);
  });

  test('Scenario 3: Selection is invalid style', async () => {
    const scenario = 'invalid-style';
    const showErrorMessageSpy = sinon.spy(vscode.window, 'showErrorMessage');

    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const filePath = path.join(workspaceFolder, scenario, 'working.js');
    const beforeFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'before.js'), 'utf8');
    const afterFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'after.js'), 'utf8');

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, 'utf8');

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('RNStylesCleaner-sidebar.focus');
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 6 col 5 to line 6 col 29
    const selection = new vscode.Selection(5, 4, 5, 28);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep();

    await vscode.commands.executeCommand('RNStylesCleaner.extractSelectionIntoStyleSheet');

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);

    // get content of current file
    const currentFile = fs.readFileSync(filePath, 'utf8');

    // assert beforeFile not equal after file
    assert.strictEqual(currentFile, afterFile);
  });

  test('Scenario 4: Clean unused style when there is 1 root style', async () => {
    const scenario = 'clean-style-1';
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;

    const filePath = path.join(workspaceFolder, scenario, 'working.js');
    const beforeFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'before.js'), 'utf8');
    const afterFile = fs.readFileSync(path.join(workspaceFolder, scenario, 'after.js'), 'utf8');

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, 'utf8');

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('RNStylesCleaner-sidebar.focus');
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep()
    await vscode.commands.executeCommand('RNStylesCleaner.removeUnusedStyles');
    await vscode.commands.executeCommand('workbench.action.files.save');
    
    // get content of current file
    const currentFile = fs.readFileSync(filePath, 'utf8');

    // assert beforeFile not equal after file
    assert.strictEqual(currentFile, afterFile);
  });

});

//sleep function
function sleep(ms?: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms ?? 200);
  });
}

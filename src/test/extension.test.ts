import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { findFiles } from "../helper";

const features = {
  styleExtraction: "styles-extraction",
  copyStyles: "copy-styles",
  removeStyles: "remove-styles",
  batchClean: "batchClean",
  duplicateStyles: "duplicate-styles",
} as const;

// get current working folder path
const workspaceFolder = path.join(
  __dirname,
  "..",
  "..",
  "src",
  "test",
  "resources"
);

suite("RN Styles Cleaner", () => {
  const showErrorMessageSpy = sinon.spy(vscode.window, "showErrorMessage");

  /* Styles Extraction */
  test("Extract styles - Scenario 1: Stylesheet contains at least one item", async () => {
    const scenario = "one-style";
    const filePath = path.join(
      workspaceFolder,
      features.styleExtraction,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "before.js"
      ),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "after.js"
      ),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 6 col 11 to line 6 col 54
    const selection = new vscode.Selection(5, 10, 5, 53);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.extractSelectionIntoStyleSheet",
      "container"
    );

    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Extract styles - Scenario 2: No stylesheet", async () => {
    const scenario = "no-style";
    const filePath = path.join(
      workspaceFolder,
      features.styleExtraction,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "before.js"
      ),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "after.js"
      ),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 6 col 11 to line 6 col 54
    const selection = new vscode.Selection(5, 10, 5, 53);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.extractSelectionIntoStyleSheet",
      "container"
    );

    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Extract styles - Scenario 3: No active editor", async () => {
    showErrorMessageSpy.resetHistory();
    // close all editor windows
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    await vscode.commands.executeCommand(
      "RNStylesCleaner.extractSelectionIntoStyleSheet"
    );

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);
  });

  test("Extract styles - Scenario 4: Selected style is multi-line", async () => {
    const scenario = "multi-line-selection";

    const filePath = path.join(
      workspaceFolder,
      features.styleExtraction,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "before.js"
      ),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "after.js"
      ),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 7 col 7 to line 10 col 9
    const selection = new vscode.Selection(6, 6, 9, 8);
    vscode.window.activeTextEditor!.selection = selection;

    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.extractSelectionIntoStyleSheet",
      "container"
    );

    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Extract styles - Scenario 5: Selection is invalid style", async () => {
    showErrorMessageSpy.resetHistory();
    const scenario = "invalid-style";

    const filePath = path.join(
      workspaceFolder,
      features.styleExtraction,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "before.js"
      ),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "after.js"
      ),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 6 col 5 to line 6 col 29
    const selection = new vscode.Selection(5, 4, 5, 28);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.extractSelectionIntoStyleSheet"
    );

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Extract styles - Scenario 6: More than 1 root style ", async () => {
    const scenario = "extract-multiple-root-styles";

    const filePath = path.join(
      workspaceFolder,
      features.styleExtraction,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "before.js"
      ),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "after.js"
      ),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 7 col 13 to line 7 col 41
    const selection = new vscode.Selection(6, 12, 6, 40);
    vscode.window.activeTextEditor!.selection = selection;

    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.extractSelectionIntoStyleSheet",
      "text",
      "stylesB"
    );

    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Extract styles - Scenario 7: 1 root style with 0 styles", async () => {
    const scenario = "one-empty-style";

    const filePath = path.join(
      workspaceFolder,
      features.styleExtraction,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "before.js"
      ),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(
        workspaceFolder,
        features.styleExtraction,
        scenario,
        "after.js"
      ),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // select line 6 col 11 to line 6 col 54
    const selection = new vscode.Selection(5, 10, 5, 53);

    vscode.window.activeTextEditor!.selection = selection;

    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.extractSelectionIntoStyleSheet",
      "container"
    );

    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  /* Styles Cleaning */

  test("Remove Unused Styles - Scenario 1: Clean unused style when there is 1 root style", async () => {
    const scenario = "clean-style-1";

    const filePath = path.join(
      workspaceFolder,
      features.removeStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();
    await vscode.commands.executeCommand("RNStylesCleaner.removeUnusedStyles");
    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Remove Unused Styles - Scenario 2: Clean unused style when there is no unused style", async () => {
    const scenario = "clean-style-no-unused";

    const filePath = path.join(
      workspaceFolder,
      features.removeStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();
    await vscode.commands.executeCommand("RNStylesCleaner.removeUnusedStyles");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Remove Unused Styles - Scenario 3: Clean unused style when there is no styles", async () => {
    showErrorMessageSpy.resetHistory();
    const scenario = "clean-style-no-styles";

    const filePath = path.join(
      workspaceFolder,
      features.removeStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();
    await vscode.commands.executeCommand("RNStylesCleaner.removeUnusedStyles");

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Remove Unused Styles - Scenario 4: Clean unused style when there is more than 1 root style", async () => {
    showErrorMessageSpy.resetHistory();
    const scenario = "clean-style-2";

    const filePath = path.join(
      workspaceFolder,
      features.removeStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();
    await vscode.commands.executeCommand("RNStylesCleaner.removeUnusedStyles");
    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Remove Unused Styles - Scenario 5: Clean multiple unused style ", async () => {
    showErrorMessageSpy.resetHistory();
    const scenario = "clean-style-multiple";

    const filePath = path.join(
      workspaceFolder,
      features.removeStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.removeStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();
    await vscode.commands.executeCommand("RNStylesCleaner.removeUnusedStyles");
    await vscode.commands.executeCommand("workbench.action.files.save");

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Remove Unused Styles - Scenario 6: No active editor", async () => {
    showErrorMessageSpy.resetHistory();
    // close all editor windows
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await sleep();
    await vscode.commands.executeCommand("RNStylesCleaner.removeUnusedStyles");

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);
  });

  /* Copy styles from selection */

  test("Copy Styles From Selection - Scenario 1: When no styles are selected", async () => {
    showErrorMessageSpy.resetHistory();

    const scenario = "copy-styles-no-selection";

    const filePath = path.join(
      workspaceFolder,
      features.copyStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.copyStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.copyStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();
    await vscode.commands.executeCommand(
      "RNStylesCleaner.copyStylesFromSelection"
    );

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Copy Styles From Selection - Scenario 2: When there is no active editor", async () => {
    showErrorMessageSpy.resetHistory();
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    await vscode.commands.executeCommand(
      "RNStylesCleaner.copyStylesFromSelection"
    );

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);
  });

  test("Copy Styles From Selection - Scenario 3: When selected one style in one line", async () => {
    const scenario = "copy-styles-one-line";

    const filePath = path.join(
      workspaceFolder,
      features.copyStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.copyStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.copyStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();

    // select line 7 col 13 to line 7 col 32
    const selection = new vscode.Selection(6, 12, 6, 31);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.copyStylesFromSelection"
    );

    await sleep();

    await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
    // save the file
    await vscode.commands.executeCommand("workbench.action.files.save");
    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Copy Styles From Selection - Scenario 4: When selection contains no styles", async () => {
    showErrorMessageSpy.resetHistory();
    const scenario = "no-styles";

    const filePath = path.join(
      workspaceFolder,
      features.copyStyles,
      scenario,
      "working.js"
    );
    const beforeFile = fs.readFileSync(
      path.join(workspaceFolder, features.copyStyles, scenario, "before.js"),
      "utf8"
    );
    const afterFile = fs.readFileSync(
      path.join(workspaceFolder, features.copyStyles, scenario, "after.js"),
      "utf8"
    );

    // create new file for testing
    fs.writeFileSync(filePath, beforeFile, "utf8");

    // Open the file in the file explorer
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await sleep();

    // select line 6 col 5 to line 6 col 55
    const selection = new vscode.Selection(5, 4, 5, 54);
    vscode.window.activeTextEditor!.selection = selection;
    await sleep();

    await vscode.commands.executeCommand(
      "RNStylesCleaner.copyStylesFromSelection"
    );

    assert.strictEqual(showErrorMessageSpy.calledOnce, true);

    // get content of current file
    const currentFile = fs.readFileSync(filePath, "utf8");

    assert.strictEqual(currentFile, afterFile);
  });

  test("Batch clean - Scenario 1: No nested files", async () => {
    showErrorMessageSpy.resetHistory();
    const scenario = "batch-clean";

    // check if working dir exists
    if (!fs.existsSync(path.join(workspaceFolder, scenario, "working"))) {
      fs.mkdirSync(path.join(workspaceFolder, scenario, "working"));
    }
    const workingDirPath = path.join(workspaceFolder, scenario, "working");

    const beforeDir = fs.readdirSync(
      path.join(workspaceFolder, scenario, "before")
    );

    // clear all files inside working dir recursively
    deleteFilesRecursively(workingDirPath);

    beforeDir.forEach((file) => {
      fs.copyFileSync(
        path.join(workspaceFolder, scenario, "before", file),
        path.join(workingDirPath, file)
      );
    });

    await vscode.commands.executeCommand(
      "RNStylesCleaner.cleanStylesForFolder",
      vscode.Uri.file(workingDirPath)
    );

    await sleep(1000);

    fs.readdirSync(workingDirPath).forEach((file) => {
      const currentFile = fs.readFileSync(
        path.join(workingDirPath, file),
        "utf8"
      );
      const afterFile = fs.readFileSync(
        path.join(workspaceFolder, scenario, "after", file),
        "utf8"
      );
      assert.strictEqual(currentFile, afterFile);
    });
  });

  test("Batch clean - Scenario 2: Nested files", async () => {
    showErrorMessageSpy.resetHistory();
    const scenario = "batch-clean-nested";

    // check if working dir exists
    if (!fs.existsSync(path.join(workspaceFolder, scenario, "working"))) {
      fs.mkdirSync(path.join(workspaceFolder, scenario, "working"));
    }
    const workingDirPath = path.join(workspaceFolder, scenario, "working");

    const beforeDir = fs.readdirSync(
      path.join(workspaceFolder, scenario, "before")
    );
    const workingDir = fs.readdirSync(
      path.join(workspaceFolder, scenario, "working")
    );

    // clear all files inside working dir recursively
    deleteFilesRecursively(workingDirPath);

    await vscode.commands.executeCommand(
      "RNStylesCleaner.cleanStylesForFolder",
      vscode.Uri.file(workingDirPath)
    );

    assert.ok(showErrorMessageSpy.calledOnce);
    assert.ok(showErrorMessageSpy.calledWith("No related files found"));

    beforeDir.forEach((file) => {
      function copyFilesRecursively(sourceDir: string, destinationDir: string) {
        const files = fs.readdirSync(sourceDir);
        files.forEach((file) => {
          const sourceFilePath = path.join(sourceDir, file);
          const destinationFilePath = path.join(destinationDir, file);
          if (fs.lstatSync(sourceFilePath).isDirectory()) {
            if (!fs.existsSync(destinationFilePath)) {
              fs.mkdirSync(destinationFilePath);
            }
            copyFilesRecursively(sourceFilePath, destinationFilePath);
          } else {
            fs.copyFileSync(sourceFilePath, destinationFilePath);
          }
        });
      }

      copyFilesRecursively(
        path.join(workspaceFolder, scenario, "before"),
        workingDirPath
      );
    });

    await vscode.commands.executeCommand(
      "RNStylesCleaner.cleanStylesForFolder",
      vscode.Uri.file(workingDirPath)
    );

    await sleep(1000);

    fs.readdirSync(workingDirPath).forEach((file) => {
      function compareFilesRecursively(dirPath: string, scenario: string) {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
          const filePath = path.join(dirPath, file);
          if (fs.lstatSync(filePath).isDirectory()) {
            compareFilesRecursively(filePath, scenario);
          } else {
            const currentFile = fs.readFileSync(filePath, "utf8");
            const afterFile = fs.readFileSync(
              path.join(workspaceFolder, scenario, "after", file),
              "utf8"
            );
            assert.strictEqual(currentFile, afterFile);
          }
        });
      }
      compareFilesRecursively(workingDirPath, scenario);
    });
  });

  suite('Duplicate Inline Styles', () => {
    const cases = fs.readdirSync(
      path.join(workspaceFolder, features.duplicateStyles)
    );

    cases.forEach((scenario) => {
      test(`Duplicate Inline Styles - Scenario ${scenario}`, async () => {
        showErrorMessageSpy.resetHistory();
        const filePath = path.join(
          workspaceFolder,
          features.duplicateStyles,
          scenario,
          "working.js"
        );
        const beforeFile = fs.readFileSync(
          path.join(
            workspaceFolder,
            features.duplicateStyles,
            scenario,
            "before.js"
          ),
          "utf8"
        );
        const afterFile = fs.readFileSync(
          path.join(
            workspaceFolder,
            features.duplicateStyles,
            scenario,
            "after.js"
          ),
          "utf8"
        );

        // create new file for testing
        fs.writeFileSync(filePath, beforeFile, "utf8");

        // Open the file in the file explorer
        const uri = vscode.Uri.file(filePath);
        await vscode.commands.executeCommand("RNStylesCleaner-sidebar.focus");
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
        await sleep();
        await vscode.commands.executeCommand(
          "RNStylesCleaner.consolidateDuplicateInlineStyles"
        );
        await vscode.commands.executeCommand("workbench.action.files.save");

        // get content of current file
        const currentFile = fs.readFileSync(filePath, "utf8");

        assert.strictEqual(currentFile, afterFile);
      });
    });
  })

});

//sleep function
function sleep(ms?: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms ?? 200);
  });
}

function deleteFilesRecursively(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        deleteFilesRecursively(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
  }
}

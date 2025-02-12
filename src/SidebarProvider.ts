import * as vscode from "vscode";
import {
  checkSelectionIsValidStyle,
  detectInlineStyles,
  findFiles,
  findStylesUsed,
  formatStyleForPasting,
  getStyles,
  isValidObjectKey,
  parseStyleFromArrayToList,
} from "./helper";
import * as _ from "lodash";
import { ExtensionConfig, InlineStyle, ParsedStyle } from "./model";

const fileExtensions = [".js", ".jsx", ".tsx"];

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _editor?: vscode.TextEditor;
  selection: string;
  styleList: ReturnType<typeof parseStyleFromArrayToList> = [];
  _config: ExtensionConfig;
  _duplicatedInlineStyles: InlineStyle[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._editor = vscode.window.activeTextEditor;
    this.selection = "";
    this._config = getExtensionConfig();
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Listen for messages from the Sidebar component and execute action
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onFetchStyles": {
          this.getStyles();
          this.detectDuplicatedInlineStyles();
          break;
        }

        case "onDelete": {
          if (!this._editor) {
            return;
          }
          this.handleRemoveUnusedStyles(this._editor, this.styleList);
          break;
        }
        case "onClickStyle": {
          const location = JSON.parse(data.value);
          const start = new vscode.Position(
            location.start.line - 1,
            location.start.column
          );
          const end = new vscode.Position(location.end.line, 0);
          const range = new vscode.Range(start, end);
          const selection = new vscode.Selection(range.start, range.end);
          //@ts-ignore
          this._editor?.selection = selection;
          this._editor?.revealRange(
            range,
            vscode.TextEditorRevealType.InCenter
          );
          this._editor?.edit((edit) => {
            edit.insert(range.start, "");
          });

          break;
        }
        case "copyStylesFromSelection": {
          this.handleCopyStylesFromSelection();
          break;
        }
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "extractStyleIntoStylesheet":
          this.handleExtractSelectionIntoStyleSheet();
          break;
        case "consolidateInlineStyles":
          this.consolidateInlineStyles();
          break;
        case "testing": {
          break;
        }
      }
    });
  }

  public async handleCleanStylesForFolder(selectedDir: vscode.Uri | undefined) {
    if (!selectedDir) {
      vscode.window.showErrorMessage("No directory selected");
      return;
    }

    const folderPath = selectedDir.fsPath;
    const reactFiles = findFiles(folderPath);

    if (reactFiles.length === 0) {
      vscode.window.showErrorMessage("No related files found");
      return;
    }

    let cleanedUpFiles = 0;

    for (let file of reactFiles) {
      const doc = await vscode.workspace.openTextDocument(file);
      const editor = await vscode.window.showTextDocument(doc);
      const text = doc.getText();
      const stylesRaw = getStyles(text);
      const styleList = parseStyleFromArrayToList(stylesRaw);
      const stylesDeleted = await this.handleRemoveUnusedStyles(
        editor,
        styleList,
        true
      );
      if (stylesDeleted > 0) {
        cleanedUpFiles++;
      }
      await editor.document.save();
      vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    }
    vscode.window.showInformationMessage(
      `${cleanedUpFiles} file${cleanedUpFiles > 1 ? "s" : ""} cleaned up!`
    );
  }

  private getLocationOfStyleSheetObject(
    style: ReturnType<typeof parseStyleFromArrayToList>[0]
  ): number {
    return style.location.end.line;
  }

  public setSelection(selection: string) {
    this.selection = selection;
    this._view?.webview.postMessage({
      type: "onReceiveSelection",
      value: JSON.stringify({
        selection: selection,
        isValidStyle: checkSelectionIsValidStyle(selection),
        stylesUsed: findStylesUsed(this.styleList, selection).map(
          (item) => `${item.rootStyleName}.${item.name}`
        ),
      }),
    });
  }

  public getTextFromSelection() {
    return this._editor?.document.getText(this._editor.selection) ?? "";
  }

  public getStyles() {
    if (!this._editor || !this._view) {
      return;
    }
    const text = this._editor.document.getText();
    try {
      const stylesRaw = getStyles(text);

      const styleList = parseStyleFromArrayToList(stylesRaw);

      this._view.webview.postMessage({
        type: "onReceiveStyles",
        value: JSON.stringify(styleList),
      });

      this.styleList = styleList;
    } catch (error) {
      console.log(error);
      this._view.webview.postMessage({
        type: "onReceiveStyles",
        value: JSON.stringify([]),
      });
    }
  }

  public detectDuplicatedInlineStyles() {
    if (!this._editor || !this._view) {
      return;
    }
    const text = this._editor.document.getText();
    try {
      const inlineStyles = detectInlineStyles(text);
      this._duplicatedInlineStyles = inlineStyles;
      this._view.webview.postMessage({
        type: "onReceiveInlineStyles",
        value: JSON.stringify(inlineStyles),
      });
    } catch (error) {
      console.log(error);
      this._view.webview.postMessage({
        type: "onReceiveInlineStyles",
        value: JSON.stringify([]),
      });
    }
  }

  private findStringRange(
    document: vscode.TextDocument,
    searchText: string
  ): vscode.Range[] {
    const fullText = document.getText();
    const ranges: vscode.Range[] = [];
    let startIndex = 0;

    while (startIndex !== -1) {
      startIndex = fullText.indexOf(searchText, startIndex);
      if (startIndex !== -1) {
        const endIndex = startIndex + searchText.length;
        const startPos = document.positionAt(startIndex);
        const endPos = document.positionAt(endIndex);
        ranges.push(new vscode.Range(startPos, endPos));
        startIndex = endIndex;
      }
    }

    return ranges;
  }

  private async replaceStringRanges(
    document: vscode.TextDocument,
    ranges: vscode.Range[],
    newText: string
  ) {
    const edit = new vscode.WorkspaceEdit();
    for (let range of ranges) {
      edit.replace(document.uri, range, newText);
    }
    await vscode.workspace.applyEdit(edit);
  }

  public async consolidateInlineStyles() {
    if (!this._editor || !this._view) {
      return;
    }
    let count = 1;
    const editor = this._editor;
    const consolidatedStyleName = this._config.consolidatedStyleName;

    for (let inlineStyle of this._duplicatedInlineStyles) {
      for (let usage of inlineStyle.usage) {
        await this.replaceStringRanges(
          editor.document,
          this.findStringRange(editor.document, usage),
          `style={styles.${consolidatedStyleName}_${count}}`
        );
      }
      if (this.styleList.length === 0) {
        const newStyleSheet = `\nconst styles = StyleSheet.create({\n});`;
        await this._editor.edit((edit) => {
          const lastLine = editor.document.lineAt(
            editor.document.lineCount - 1
          );
          const endPosition = lastLine.range.end;
          edit.insert(endPosition, newStyleSheet);
        });
      }
      this.getStyles();
      await this.handleExtractStylesIntoStylesheet({
        editor: editor,
        rootStyle: this.styleList[0],
        newStyleName: `${consolidatedStyleName}_${count}`,
        appendToStyleSheetOnly: true,
        rootStyleName: this.styleList[0].rootName,
        styleString: inlineStyle.usage[0],
      });
      count++;
    }
    this._duplicatedInlineStyles = [];
    this._view.webview.postMessage({
      type: "onReceiveInlineStyles",
      value: JSON.stringify([]),
    });
  }

  public updateExtensionConfig() {
    this._config = getExtensionConfig();
    this._view?.webview.postMessage({
      type: "onReceiveConfig",
      value: JSON.stringify(this._config),
    });
  }

  public async handleExtractSelectionIntoStyleSheet(
    newStyleName?: string,
    rootStyleName = ""
  ) {
    if (!this._editor) {
      vscode.window.showErrorMessage("No active text editor found");
      return;
    }

    try {
      if (!newStyleName) {
        newStyleName = await vscode.window.showInputBox({
          title: "Enter style name",
          placeHolder: "styleName",
        });
      }

      if (!newStyleName) {
        return;
      }

      if (!isValidObjectKey(newStyleName)) {
        vscode.window.showErrorMessage("Invalid style name");
        return;
      }

      const selection = this._editor.selection;

      if (this.styleList.length > 1) {
        const options = this.styleList.map((style) => style.rootName);
        let selectedRootStyleName = rootStyleName;
        if (!selectedRootStyleName) {
          selectedRootStyleName =
            (await vscode.window.showQuickPick(options)) ?? "";
        }
        if (!selectedRootStyleName) {
          return;
        }

        const selectedRootStyle = this.styleList.find(
          (style) => style.rootName === selectedRootStyleName
        );
        if (!selectedRootStyle) {
          vscode.window.showErrorMessage("Invalid style selected");
          return;
        }

        await this.handleExtractStylesIntoStylesheet({
          editor: this._editor!,
          selection,
          newStyleName,
          rootStyleName: selectedRootStyleName,
          rootStyle: selectedRootStyle,
        });
        vscode.window.showInformationMessage(
          `Style extracted into ${newStyleName}!`
        );
      } else if (this.styleList.length === 1) {
        await this.handleExtractStylesIntoStylesheet({
          editor: this._editor!,
          selection,
          newStyleName,
          rootStyleName: this.styleList[0].rootName,
          rootStyle: this.styleList[0],
        });
        vscode.window.showInformationMessage(
          `Style extracted into ${newStyleName}!`
        );
      } else {
        // get line count in editor
        const lineCount = this._editor?.document.lineCount;
        if (lineCount) {
          const start = new vscode.Position(lineCount, 0);
          const end = new vscode.Position(lineCount, 0);
          const range = new vscode.Range(start, end);
          this._editor?.edit((edit) => {
            edit.insert(
              range.start,
              `\n\nconst styles = StyleSheet.create({\n` +
                formatStyleForPasting(this.selection, newStyleName!) +
                `});`
            );
            edit.delete(selection);
            edit.insert(selection.start, `style={styles.${newStyleName}}`);
            vscode.window.showInformationMessage(
              `Style extracted into ${newStyleName}!`
            );
          });
        } else {
          throw new Error("Could not find location to insert style");
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage("Failed to extract style into stylesheet");
      console.error(error);
    }
  }

  public async handleRemoveUnusedStyles(
    editor: vscode.TextEditor,
    styleList: ParsedStyle[],
    hideDeletedStylesInfoPrompt?: boolean
  ): Promise<number> {
    const stylesToDelete = _.flatMap(
      styleList.map((item) => item.styles)
    ).filter((item) => item.usage === 0);

    editor.edit((edit) => {
      for (let styleToDelete of stylesToDelete) {
        const start = new vscode.Position(
          styleToDelete.details.item.loc!.start.line! - 1,
          0
        );
        const end = new vscode.Position(
          styleToDelete.details.item.loc!.end.line!,
          0
        );
        const location = new vscode.Range(start, end);
        edit.delete(location);
      }
    });
    if (!hideDeletedStylesInfoPrompt) {
      vscode.window.showInformationMessage(
        `${stylesToDelete.length} style${
          stylesToDelete.length > 1 ? "s" : ""
        } deleted successfully!`
      );
    }

    // update UI styles
    this._view?.webview.postMessage({
      type: "removeUnusedStylesSuccess",
      value: "",
    });

    return stylesToDelete.length;
  }

  private async handleExtractStylesIntoStylesheet({
    editor,
    selection,
    newStyleName,
    rootStyle,
    rootStyleName,
    styleString,
    appendToStyleSheetOnly = false,
  }: {
    editor: vscode.TextEditor;
    selection?: vscode.Selection | vscode.Range;
    newStyleName: string;
    rootStyleName: string;
    rootStyle: ParsedStyle;
    styleString?: string;
    appendToStyleSheetOnly?: boolean;
  }) {
    const isStyleSheetCreateSingleLine =
      rootStyle.location.start.line === rootStyle.location.end.line;
    const lineContent = editor.document.lineAt(
      rootStyle.location.start.line - 1
    ).text;
    const endLineForExistingStyle =
      this.getLocationOfStyleSheetObject(rootStyle);
    editor.edit((edit) => {
      if (isStyleSheetCreateSingleLine) {
        const insertColumn = lineContent.lastIndexOf("})");
        edit.insert(
          new vscode.Position(endLineForExistingStyle - 1, insertColumn),
          "\n" +
            formatStyleForPasting(styleString ?? this.selection, newStyleName)
        );
      } else {
        edit.insert(
          new vscode.Position(endLineForExistingStyle - 1, 0),
          formatStyleForPasting(styleString ?? this.selection, newStyleName)
        );
      }
      if (!appendToStyleSheetOnly && !!selection) {
        edit.delete(selection);
        edit.insert(
          selection.start,
          `style={${rootStyleName}.${newStyleName}}`
        );
      }
    });
  }

  public async handleCopyStylesFromSelection() {
    if (!this._editor || !this._editor.selection) {
      vscode.window.showErrorMessage("No active text editor found");
      return;
    }

    const selectedText = this._editor.document.getText(this._editor.selection);
    if (!selectedText) {
      vscode.window.showErrorMessage("No selection found");
      return;
    }

    const stylesUsed = findStylesUsed(this.styleList, selectedText);
    if (stylesUsed.length === 0) {
      vscode.window.showErrorMessage("No styles within selection!");
      return;
    }
    const ranges = [];
    for (let style of stylesUsed) {
      const start = new vscode.Position(
        style.loc!.start.line - 1,
        style.loc!.start.column
      );
      const end = new vscode.Position(style.loc!.end.line, 0);
      const range = new vscode.Range(start, end);
      ranges.push(range);
    }
    this._editor.selections = ranges.map(
      (range) => new vscode.Selection(range.start, range.end)
    );
    const newSelectedText = this._editor.selections
      .map((selection) => this._editor?.document.getText(selection))
      .join("");

    vscode.env.clipboard.writeText(newSelectedText).then(() => {
      vscode.window.showInformationMessage("Copied styles to clipboard!");
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    //@ts-ignore
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    //@ts-ignore
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    //@ts-ignore
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled/sidebar.js'));
    //@ts-ignore
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled/sidebar.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <script nonce="${nonce}">
                    const tsvscode = acquireVsCodeApi();
                </script>

			</head>
            <body>
				<script nonce="${nonce}" src="${scriptUri}"></link>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration("RNStylesCleaner");
  return {
    highlightColor: config.get("highlightColor") ?? "#FFFF00",
    unusedStyleColor: config.get("unusedStyleColor") ?? "#eb173a",
    usedStyleColor: config.get("usedStyleColor") ?? "#4daafc",
    consolidatedStyleName: config.get("consolidatedStyleName") ?? "consolidatedStyle",
  };
}

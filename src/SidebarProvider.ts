import * as vscode from 'vscode';
import { checkSelectionIsValidStyle, findStylesUsed, formatStyleForPasting, getStyles, isValidObjectKey, parseStyleFromArrayToList } from './helper';
import * as _ from 'lodash';
import { ParsedStyle } from './model';

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _editor?: vscode.TextEditor;
  selection: string;
  styleList: ReturnType<typeof parseStyleFromArrayToList> = [];

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._editor = vscode.window.activeTextEditor;
    this.selection = '';
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
        case 'onFetchStyles': {
          this.getStyles();
          break;
        }

        case 'onDelete': {
          this.handleRemoveUnusedStyles();
          break;
        }
        case 'onClickStyle': {
          const location = JSON.parse(data.value);
          const start = new vscode.Position(location.start.line - 1, location.start.column);
          const end = new vscode.Position(location.end.line, 0);
          const range = new vscode.Range(start, end);
          const selection = new vscode.Selection(range.start, range.end);
          //@ts-ignore
          this._editor?.selection = selection;
          this._editor?.revealRange(range, vscode.TextEditorRevealType.InCenter);
          this._editor?.edit((edit) => {
            edit.insert(range.start, '');
          });

          break;
        }
        case 'copyStylesFromSelection': {
          if (!this._editor || !this._editor.selection) {
            break;
          }
          const selection = this._editor.document.getText(this._editor.selection);
          const stylesUsed = findStylesUsed(this.styleList, selection);
          if (stylesUsed.length === 0) {
            vscode.window.showErrorMessage('No styles within selection!');
            break;
          }
          const ranges = [];
          for (let style of stylesUsed) {
            const start = new vscode.Position(style.loc!.start.line - 1, style.loc!.start.column);
            const end = new vscode.Position(style.loc!.end.line, 0);
            const range = new vscode.Range(start, end);
            ranges.push(range);
          }
          this._editor.selections = ranges.map((range) => new vscode.Selection(range.start, range.end));
          const selectedText = this._editor.selections.map((selection) => this._editor?.document.getText(selection)).join('');

          vscode.env.clipboard.writeText(selectedText).then(() => {
            vscode.window.showInformationMessage('Copied styles to clipboard!');
          });
          break;
        }
        case 'onInfo': {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case 'onError': {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case 'extractStyleIntoStylesheet':
          this.handleExtractSelectionIntoStyleSheet();
          break;
        case 'testing': {
          const selection = this._editor?.document.getText(this._editor.selection) ?? '';
          console.log({ selection });
          console.log({ isValid: checkSelectionIsValidStyle(selection) });
        }
      }
    });
  }

  private getLocationOfStyleSheetObject(style: ReturnType<typeof parseStyleFromArrayToList>[0]): number {
    return style.location.end.line;
  }

  public setSelection(selection: string) {
    this.selection = selection;
    this._view?.webview.postMessage({
      type: 'onReceiveSelection',
      value: JSON.stringify({
        selection: selection,
        isValidStyle: checkSelectionIsValidStyle(selection),
      }),
    });
  }

  public getTextFromSelection() {
    return this._editor?.document.getText(this._editor.selection) ?? '';
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
        type: 'onReceiveStyles',
        value: JSON.stringify(styleList),
      });

      this.styleList = styleList;
    } catch (error) {
      console.log(error);
      this._view.webview.postMessage({
        type: 'onReceiveStyles',
        value: JSON.stringify([]),
      });
    }
  }

  public async handleExtractSelectionIntoStyleSheet(newStyleName?: string, rootStyleName = '') {
    if (!this._editor) {
      vscode.window.showErrorMessage('No active text editor found');
      return;
    }

    try {
      if (!newStyleName) {
        newStyleName = await vscode.window.showInputBox({
          title: 'Enter style name',
          placeHolder: 'styleName',
        });
      }

      if (!newStyleName) return;

      if (!isValidObjectKey(newStyleName)) {
        vscode.window.showErrorMessage('Invalid style name');
        return;
      }

      const selection = this._editor.selection;

      if (this.styleList.length > 1) {
        // FIXME:
        // vs code prompt for selection
        const options = this.styleList.map((style) => style.rootName);
        let selectedRootStyleName = rootStyleName;
        if (!selectedRootStyleName) {
          selectedRootStyleName = (await vscode.window.showQuickPick(options)) ?? '';
        }
        if (!selectedRootStyleName) return;

        const selectedRootStyle = this.styleList.find((style) => style.rootName === selectedRootStyleName);
        if (!selectedRootStyle) {
          vscode.window.showErrorMessage('Invalid style selected');
          return;
        }

        await this.handleExtractStylesIntoStylesheet({
          editor: this._editor!,
          selection,
          newStyleName,
          rootStyleName: selectedRootStyleName,
          rootStyle: selectedRootStyle,
        });
        vscode.window.showInformationMessage(`Style extracted into ${newStyleName}!`);
      } else if (this.styleList.length === 1) {
        await this.handleExtractStylesIntoStylesheet({
          editor: this._editor!,
          selection,
          newStyleName,
          rootStyleName: this.styleList[0].rootName,
          rootStyle: this.styleList[0],
        });
        vscode.window.showInformationMessage(`Style extracted into ${newStyleName}!`);
      } else {
        // get line count in editor
        const lineCount = this._editor?.document.lineCount;
        if (lineCount) {
          const start = new vscode.Position(lineCount, 0);
          const end = new vscode.Position(lineCount, 0);
          const range = new vscode.Range(start, end);
          this._editor?.edit((edit) => {
            edit.insert(range.start, `\n\nconst styles = StyleSheet.create({\n` + formatStyleForPasting(this.selection, newStyleName!) + `});`);
            edit.delete(selection);
            edit.insert(selection.start, `style={styles.${newStyleName}}`);
            vscode.window.showInformationMessage(`Style extracted into ${newStyleName}!`);
          });
        } else {
          throw new Error('Could not find location to insert style');
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage('Failed to extract style into stylesheet');
      console.error(error);
    }
  }

  public async handleRemoveUnusedStyles() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor');
      return;
    }

    if (this.styleList.length === 0) {
      vscode.window.showErrorMessage('Nothing to delete');
      return;
    }

    const stylesToDelete = _.flatMap(this.styleList.map((item) => item.styles)).filter((item) => item.usage === 0);

    editor.edit((edit) => {
      for (let styleToDelete of stylesToDelete) {
        const start = new vscode.Position(styleToDelete.details.item.loc!.start.line! - 1, 0);
        const end = new vscode.Position(styleToDelete.details.item.loc!.end.line!, 0);
        const location = new vscode.Range(start, end);
        edit.delete(location);
      }
    });
    vscode.window.showInformationMessage(`${stylesToDelete.length} style${stylesToDelete.length > 1 ? 's' : ''} deleted successfully!`);

    // update UI styles
    this._view?.webview.postMessage({
      type: 'removeUnusedStylesSuccess',
      value: '',
    });
  }

  private async handleExtractStylesIntoStylesheet({
    editor,
    selection,
    newStyleName,
    rootStyle,
    rootStyleName,
  }: {
    editor: vscode.TextEditor;
    selection: vscode.Selection;
    newStyleName: string;
    rootStyleName: string;
    rootStyle: ParsedStyle;
  }) {
    const isStyleSheetCreateSingleLine = rootStyle.location.start.line === rootStyle.location.end.line;
    const lineContent = editor.document.lineAt(rootStyle.location.start.line - 1).text;
    const endLineForExistingStyle = this.getLocationOfStyleSheetObject(rootStyle);
    editor.edit((edit) => {
      if (isStyleSheetCreateSingleLine) {
        const insertColumn = lineContent.lastIndexOf('})');
        console.log({ insertColumn });
        edit.insert(new vscode.Position(endLineForExistingStyle, insertColumn), formatStyleForPasting(this.selection, newStyleName));
      } else {
        edit.insert(new vscode.Position(endLineForExistingStyle - 1, 0), formatStyleForPasting(this.selection, newStyleName));
      }
      edit.delete(selection);
      edit.insert(selection.start, `style={${rootStyleName}.${newStyleName}}`);
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
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

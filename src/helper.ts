import { parse } from '@babel/parser';
import * as _ from 'lodash';
import { ParsedStyle, StyleDetail, StyleUsed } from './model';
import * as fs from 'fs'
import * as path from 'path'



export function getStyles(text: string): StyleDetail[] {
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'classProperties', 'typescript'],
  });

  const styleList: StyleDetail[] = [];

  ast.program.body
    .filter((node) => node.type === 'VariableDeclaration')
    .forEach((node: any) => {
      node.declarations
        .filter((item: any) => item.type === 'VariableDeclarator')
        .forEach((item: any) => {
          const init = item.init;
          const callee = init?.callee;
          const obj = callee?.object;
          const property = callee?.property;

          const styles: any = {};
          let rootName = '';
          const styleType = 'normal';
          let location: any = {};

          if (init.type === 'CallExpression' && obj?.name === 'StyleSheet' && property?.name === 'create') {
            rootName = item.id.name;

            location = item.loc;
            init?.arguments[0].properties.forEach((item: any) => {
              const name = item.key.name;
              styles[name] = {
                usage: 0,
                details: { item },
              };
            });

            styleList.push({
              styles,
              rootName,
              styleType,
              location,
            });
          } else if (init.type === 'ArrowFunctionExpression' && init.body.callee?.object.name === 'StyleSheet') {
            rootName = item.id.name ?? '';
            const styleType = 'arrow';
            location = item.loc;

            init.body.arguments[0].properties.forEach((item: any) => {
              const name = item.key.name;
              styles[name] = {
                usage: 0,
                details: { item },
              };
            });

            styleList.push({
              styles,
              rootName,
              styleType,
              location,
            });
          }
        });
    });

  for (let i = 0; i < styleList.length; i++) {
    const styleObj = styleList[i];
    for (let item in styleObj.styles) {
      const name = item;
      let styleToMatch = `${styleObj.rootName}.${name}`;
      if (styleObj.styleType === 'arrow') {
        styleToMatch = `${styleObj.rootName}(.+).${name}`;
      }
      const regex = new RegExp(styleToMatch, 'g');
      const matches = text.match(regex);
      const useCount = matches ? matches.length : 0;
      styleList[i].styles[name].usage = useCount;
    }
  }

  return styleList;
}


export function parseStyleFromArrayToList(stylesRaw: StyleDetail[]): ParsedStyle[] {
  const styleList: any = [];
  for (let i = 0; i < stylesRaw.length; i++) {
    const styleDetail: any = [];
    for (let style in stylesRaw[i].styles) {
      styleDetail.push({
        name: style,
        ...stylesRaw[i].styles[style],
      });
    }
    styleList.push({
      ...stylesRaw[i],
      styles: styleDetail,
    });
  }
  return styleList;
}

export function findStylesUsed(styleList: ParsedStyle[], selection: string): StyleUsed[] {
  const stylesUsed = [];
  for (let i = 0; i < styleList.length; i++) {
    const styleObj = styleList[i];
    for (let j = 0; j < styleObj.styles.length; j++) {
      const item = styleObj.styles[j];
      const name = item.name;
      let styleToMatch = `${styleObj.rootName}.${name}`;
      if (styleObj.styleType === 'arrow') {
        styleToMatch = `${styleObj.rootName}(.+).${name}`;
      }
      const regex = new RegExp(styleToMatch, 'g');
      const matches = selection.match(regex);
      const isUsed = matches;
      if (isUsed) {
        stylesUsed.push({
          rootStyleName: styleObj.rootName,
          name: name,
          loc: styleList[i].styles[j].details.item.loc,
        });
      }
    }
  }
  return stylesUsed;
}

export function checkSelectionIsValidStyle(selection: string): boolean {
  if (!selection.startsWith('style={{')) {
    return false;
  }
  if (!selection.endsWith('}}')) {
    return false;
  }
  const trimmed = selection.replace(/\s/g, '');
  const styleContents = trimmed.slice('style={{'.length, -2);
  const keyValuePairs = _.compact(styleContents.split(','));
  if (keyValuePairs.length === 0) {
    return false;
  }

  const isAllValidStyles = keyValuePairs.every((pair) => {
    const [key, value] = pair.split(':', 2);
    if (!key || !value) {
      return false;
    }
    return true;
  });
  if (!isAllValidStyles) {
    return false;
  }

  return true;
}

export function getStyleContents(style: string): string[] {
  const trimmed = style.replace(/\s/g, '');
  const styleContents = trimmed.slice('style={{'.length, -2);
  const styles = [];
  let currentKey = ''
  let currentValue = '';
  let state: 'key' | 'value' = 'key';
  let nestedLevel = 0;
  for (let char of styleContents) {
    if (char === '[') {
      nestedLevel++;
    }
    if (char === ']') {
      nestedLevel--;
    }
    if (char === ':' && !nestedLevel) {
      state = 'value';
      continue;
    } 
    if (char === ',' && !nestedLevel) {
      if (currentKey && currentValue) {
        styles.push(`${currentKey}: ${currentValue}`);
      }
      currentKey = '';
      currentValue = '';
      state = 'key';
      continue;
    }
    if (char === ':' && nestedLevel) {
      currentValue += ': '
      continue;
    }
    if (char === ',' && nestedLevel) {
      currentValue += ', ';
      continue;
    }
    if (state === 'key') {
      currentKey += char;
    }
    if (state === 'value') {
      currentValue += char;
    } 
  }
  if (currentKey && currentValue) {
    styles.push(`${currentKey}: ${currentValue}`);
  }

  return styles;
}

export function formatStyleForPasting(styles: string, styleName: string): string {
  const styleContents = getStyleContents(styles);
  const formatted = styleContents.map((item) => {
    return `    ${item}`;
  });
  return '  ' + styleName + ': {\n' + formatted.join(',\n') + ',\n  },\n';
}

export function isValidObjectKey(str: string) {
  if (typeof str !== 'string' || str === '' || str.startsWith('_') || /^\d/.test(str) || str.includes(' ')) {
    return false;
  }
  return true;
}

export function findFiles(directory: string) {
  const fileExtensions = ['.js', '.jsx', '.tsx'];
  const foundFiles: string[] = [];

  function traverseDirectory(currentPath: string) {
    const files = fs.readdirSync(currentPath);

    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isDirectory()) {
        traverseDirectory(filePath); // Recursively traverse nested directories
      } else if (fileExtensions.includes(path.extname(file))) {
        foundFiles.push(filePath);
      }
    });
  }

  traverseDirectory(directory);
  return foundFiles;
}
//@ts-nocheck

import { parse } from '@babel/parser';
import { SourceLocation, ObjectProperty } from '@babel/types';

type StyleDetail = {
  rootName: string;
  styles: any;
  location: SourceLocation;
  styleType: 'normal' | 'arrow';
};
export function getStyles(text: string): StyleDetail[] {
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'classProperties', 'typescript'],
  });

  const styleList: StyleDetail[] = [];

  ast.program.body
    .filter((node) => node.type === 'VariableDeclaration')
    .forEach((node) => {
      node.declarations
        .filter((item) => item.type === 'VariableDeclarator')
        .forEach((item) => {
          const init = item.init;
          const callee = init?.callee;
          const obj = callee?.object;
          const property = callee?.property;

          const styles = {};
          let rootName = '';
          let styleType = 'normal';
          let location = {};

          if (init.type === 'CallExpression' && obj?.name === 'StyleSheet' && property?.name === 'create') {
            rootName = item.id.name;

            location = item.loc;
            init?.arguments[0].properties.forEach((item) => {
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
            styleType = 'arrow';
            location = item.loc;

            init.body.arguments[0].properties.forEach((item) => {
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

type ItemDetail = NonNullable<ObjectProperty>

type ParsedStyle = {
  rootName: string;
  styles: {
    name: string;
    usage: number;
    details: { item: ItemDetail };
  }[];
  location: SourceLocation;
  styleType: 'normal' | 'arrow';
};
export function parseStyleFromArrayToList(stylesRaw): ParsedStyle[] {
  const styleList: any = [];
  for (let i = 0; i < stylesRaw.length; i++) {
    const styleDetail: any = [];
    // console.log(stylesRaw[i])
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

export function findStylesUsed(styleList, text) {
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
      const matches = text.match(regex);
      const isUsed = matches;
      if (isUsed) {
        stylesUsed.push({
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
  const keyValuePairs = styleContents.split(',');
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
  const keyValuePairs = styleContents
    .split(',')
    .filter((item) => !!item)
    .map((item) => item.replace(/:/, ': '));
  return keyValuePairs;
}

export function formatStyleForPasting(styles: string, styleName: string): string {
  const styleContents = getStyleContents(styles);
  const formatted = styleContents.map((item) => {
    return `    ${item}`;
  });
  return '  ' + styleName + ': {\n' + formatted.join(',\n') + ',\n  },\n';
}

export function isValidObjectKey(str) {
  if (typeof str !== 'string' || str === '' || str.startsWith('_') || /^\d/.test(str) || str.includes(' ')) {
    return false;
  }
  return true;
}

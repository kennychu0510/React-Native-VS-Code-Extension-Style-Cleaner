//@ts-nocheck

import { parse } from '@babel/parser';

export function getStyles(text: string) {
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'classProperties', 'typescript'],
  });

  const styles: any = {};
  let globalStyleName = '';
  let stylesType = 'normal';

  ast.program.body.forEach((node) => {
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((item) => {
        if (item.type === 'VariableDeclarator') {
          const init = item.init;
          const callee = init?.callee;
          const obj = callee?.object;
          const property = callee?.property;
  
          const id = item.id;
          styleObjectLoc = id.loc;
          globalStyleName = id.name;
          let properties = null;
  
          if (init.type === 'CallExpression') {
            if (obj?.name === 'StyleSheet' && property?.name === 'create') {
              properties = init?.arguments[0].properties;
            }
          } else if (init.type === 'ArrowFunctionExpression') {
            if (init.body.callee.object.name === 'StyleSheet') {
              properties = init.body.arguments[0].properties;
            }
            stylesType = 'arrow';
          }
          properties?.forEach((item) => {
            const name = item.key.name;
            styles[name] = {
              usage: 0,
              details: {
                item,
              },
            };
          });
        }
      });
    }
  });

  for (let item in styles) {
    const name = item;
    let styleToMatch = `${globalStyleName}.${name}`;
    if (stylesType === 'arrow') {
      styleToMatch = `${globalStyleName}(.+).${name}`;
    }
    const regex = new RegExp(styleToMatch, 'g');
    const matches = text.match(regex);
    const useCount = matches ? matches.length : 0;
    styles[name].usage = useCount;
  }

  return {
    styles,
    globalStyleName,
  };
}

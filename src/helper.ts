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
  let styleLocation = {}

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

          if (init.type === 'CallExpression' && obj?.name === 'StyleSheet' && property?.name === 'create' && !globalStyleName) {
            globalStyleName = item.id.name;

            styleLocation = item.loc;
            init?.arguments[0].properties.forEach((item) => {
              const name = item.key.name;
              styles[name] = {
                usage: 0,
                details: { item },
              };
            });
          } else if (init.type === 'ArrowFunctionExpression' && init.body.callee?.object.name === 'StyleSheet' && !globalStyleName) {
            globalStyleName = item.id.name ?? '';
            stylesType = 'arrow';
            styleLocation = item.loc;

            init.body.arguments[0].properties.forEach((item) => {
              const name = item.key.name;
              styles[name] = {
                usage: 0,
                details: { item },
              };
            });
          }
        });
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
    styleLocation
  };
}

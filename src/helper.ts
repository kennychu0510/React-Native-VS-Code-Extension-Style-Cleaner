import { parse } from '@babel/parser';
import { CallExpression, Expression, File, Identifier, MemberExpression, ObjectExpression, ObjectProperty, PrivateName } from '@babel/types';

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
          const init = item.init as CallExpression;
          const callee = init?.callee as MemberExpression;
          const obj = callee?.object as Identifier;
          const property = callee?.property as Identifier;
          if (init.type === 'CallExpression') {
            if (obj?.name === 'StyleSheet' && property?.name === 'create') {
              const id = item.id as Identifier;
              globalStyleName = id.name;
              //@ts-ignore
              init?.arguments[0].properties.forEach((item) => {
                const name = item.key.name;
                styles[name] = {
                  usage: 0,
                  details: {
                    item,
                  },
                };
              });
            }
          } else if (init.type === 'ArrowFunctionExpression') {
            //@ts-ignore
            if (init.body.callee.object.name === 'StyleSheet') {
              //@ts-ignore
              init.body.arguments[0].properties.forEach((item) => {
                const name = item.key.name;
                styles[name] = {
                  usage: 0,
                  details: {
                    item,
                  },
                };
              });
              //@ts-ignore
              globalStyleName = item.id.name ?? '';
              stylesType = 'arrow';
            }
          }
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

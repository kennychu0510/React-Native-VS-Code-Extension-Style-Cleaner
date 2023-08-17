import { parse } from '@babel/parser';
import { CallExpression, Expression, File, Identifier, MemberExpression, ObjectExpression, ObjectProperty, PrivateName } from '@babel/types';

export function extractStyles(text: string) {
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'classProperties', "typescript"],
  });
  const { styleName, stylePropContainer } = getStyleName(ast);

}

function getStyleName(ast: File): { styleName: string; stylePropContainer: ObjectExpression | null } {
  let styleName = '';
  let stylePropContainer: ObjectExpression | null = null;
  ast.program.body.forEach((item) => {
    if (item.type === 'VariableDeclaration') {
      item?.declarations?.forEach((dec) => {
        if (dec.type === 'VariableDeclarator') {
          const init = dec.init as CallExpression;
          const callee = init?.callee as MemberExpression;
          const obj = callee?.object as Identifier;
          const property = callee?.property as Identifier;
          if (obj?.name === 'StyleSheet' && property?.name === 'create') {
            const id = dec.id as Identifier;
            styleName = id?.name;
            const args = init?.arguments as [ObjectExpression];
            stylePropContainer = args?.[0];
          }
        }
      });
    }
  });
  return {
    styleName,
    stylePropContainer,
  };
}

export function getStyles(text: string) {
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'classProperties', 'typescript'],
  });

  const styles: any = {}
  let globalStyleName = '';

  ast.program.body.forEach((node) => {
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((item) => {
        if (item.type === 'VariableDeclarator') {
          const init = item.init as CallExpression;
          const callee = init?.callee as MemberExpression;
          const obj = callee?.object as Identifier;
          const property = callee?.property as Identifier;
          if (obj?.name === 'StyleSheet' && property?.name === 'create') {
            const id = item.id as Identifier;
            globalStyleName = id.name;
            init?.arguments[0].properties.forEach((item) => {
              const name = item.key.name;
              styles[name] = {
                usage: 0,
                details: {
                  item
                }
              }
            });
          }
        }
      });
    }
  });

  for (let item in styles) {
    const name = item;
    const styleToMatch = `${globalStyleName}.${name}`;
    const regex = new RegExp(styleToMatch, 'g');
    const matches = text.match(regex);
    const useCount = matches ? matches.length : 0;
    styles[name].usage = useCount
  }

  return {
    styles,
    globalStyleName,
  };
}
import { parse } from '@babel/parser';
import { CallExpression, Expression, File, Identifier, MemberExpression, ObjectExpression, ObjectProperty, PrivateName } from '@babel/types';

export function extractStyles(text: string) {
  const ast = parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'classProperties', "typescript"],
  });
  const { styleName, stylePropContainer } = getStyleName(ast);
  const styles = stylePropContainer?.properties.filter(item => item.type === 'ObjectProperty').map((_item) => {
    const item = _item as ObjectProperty
    const key = item.key
    
    
  })
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

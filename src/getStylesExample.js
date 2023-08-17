const { parse } = require('@babel/parser');

const text = `import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

type Props = {
  top: number;
  left: number
}

const Popup = (props: Props) => {
  const { top, left } = props
  return (
    <View style={[styles.container, { top, left}]}>
      <Text>Popup</Text>
    </View>
  );
};

export default Popup;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 10,
    position: 'absolute'
  },
  unused: {
    width: 10,
  }
});
`;
const ast = parse(text, {
  sourceType: 'unambiguous',
  plugins: ['jsx', 'classProperties', 'typescript'],
});

const styles = new Map();
let globalStyleName = '';
ast.program.body.forEach((node) => {
  if (node.type === 'VariableDeclaration') {
    node.declarations.forEach((item) => {
      if (item.type === 'VariableDeclarator') {
        const init = item.init;
        const callee = init?.callee;
        const obj = callee?.object;
        const property = callee?.property;
        if (obj?.name === 'StyleSheet' && property?.name === 'create') {
          globalStyleName = item.id?.name;
          init?.arguments[0].properties.forEach((item) => {
            const name = item.key.name;
            styles.set(name, 0);
          });
        }
      }
    });
  }
});

for (let item of styles) {
  const name = item[0];
  const styleToMatch = `${globalStyleName}.${name}`;
  const regex = new RegExp(styleToMatch, 'g');
  const matches = text.match(regex);
  const useCount = matches ? matches.length : 0;
  styles.set(name, useCount);
}


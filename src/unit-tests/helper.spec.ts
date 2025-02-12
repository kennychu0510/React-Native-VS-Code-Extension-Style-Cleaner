import { expect, test, describe, it } from 'vitest';
import { checkSelectionIsValidStyle, findStylesUsed, getStyles, parseStyleFromArrayToList, formatStyleForPasting, getStyleContents, findFiles, detectInlineStyles } from '../helper';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const folderDirectory = path.join(__dirname, 'src', 'unit-tests');

describe('For all styles used file', () => {
  const text = fs.readFileSync(path.join(folderDirectory, 'file1.js'), {
    encoding: 'utf-8',
  });
  const result = getStyles(text)[0];

  test('get styles return the correct shape', () => {
    expect(result).toHaveProperty('rootName');
    expect(result).toHaveProperty('styles');
    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('styleType');
  });

  test('each style is used once', () => {
    expect(result.styles.container.usage).toBe(1);
    expect(result.styles.text.usage).toBe(1);
  });
});

describe('For no styles used file', () => {
  const text = fs.readFileSync(path.join(folderDirectory, 'file2.js'), {
    encoding: 'utf-8',
  });
  const result = getStyles(text)[0];

  test('no style is used', () => {
    expect(result.styles.container.usage).toBe(0);
    expect(result.styles.text.usage).toBe(0);
  });
});

describe('For stylesheet created as arrow function', () => {
  const text = fs.readFileSync(path.join(folderDirectory, 'file3.js'), {
    encoding: 'utf-8',
  });
  const result = getStyles(text)[0];

  test('get styles return the correct shape', () => {
    expect(result).toHaveProperty('rootName');
    expect(result).toHaveProperty('styles');
    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('styleType');
  });

  test('correctly extract style usage', () => {
    expect(result.styles.container.usage).toBe(1);
    expect(result.styles.text.usage).toBe(0);
  });
});

describe('For multiple styles in component', () => {
  const text = fs.readFileSync(path.join(folderDirectory, 'file4.js'), {
    encoding: 'utf-8',
  });
  const result = getStyles(text);
  const componentStyle = result.find((item) => item.rootName === 'componentStyle');
  const styles = result.find((item) => item.rootName === 'styles');

  test('expect result to return 2 styles', () => {
    expect(result.length).toBe(2);
  });

  test('expect all the root styles to be found', () => {
    expect(componentStyle).toBeDefined();
    expect(styles).toBeDefined();
  });

  test('expect style usage of individual styles are correct', () => {
    expect(componentStyle!.styles.componentContainer.usage).toBe(1);
    expect(componentStyle!.styles.text.usage).toBe(0);

    expect(styles!.styles.container.usage).toBe(0);
    expect(styles!.styles.text.usage).toBe(1);
  });
});

describe('transform style from object to array', () => {
  const text = fs.readFileSync(path.join(folderDirectory, 'file1.js'), {
    encoding: 'utf-8',
  });
  const result = getStyles(text);
  const parsedStyles = parseStyleFromArrayToList(result);
  test('transform style object to array correctly', () => {
    parsedStyles.forEach((style) => {
      expect(style.styles).toSatisfy((item) => Array.isArray(item));
    });
  });
});

describe('findStylesUsed', () => {
  test('Case 1', () => {
    const text = fs.readFileSync(path.join(folderDirectory, 'file1.js'), {
      encoding: 'utf-8',
    });
    const result = getStyles(text);
    const styleList = parseStyleFromArrayToList(result);
    const selection = `
    <View style={styles.container}>
        <Text style={styles.text}>file1</Text>
      </View>
    `;
    const stylesUsed = findStylesUsed(styleList, selection);
    const containerStyleIsUsed = stylesUsed.find((item) => item.name === 'container');
    const textStyleIsUsed = stylesUsed.find((item) => item.name === 'text');
    const rootStyle = stylesUsed.every((item) => item.rootStyleName === 'styles');
    expect(containerStyleIsUsed).toBeDefined();
    expect(textStyleIsUsed).toBeDefined();
    expect(rootStyle).toBe(true);
  });

  test('Case 2', () => {
    const text = fs.readFileSync(path.join(folderDirectory, 'file4.js'), {
      encoding: 'utf-8',
    });
    const result = getStyles(text);
    const styleList = parseStyleFromArrayToList(result);
    const selection = `
    const Component = () => {
  return (
    <View style={componentStyle.componentContainer}>
      <Text>file</Text>
    </View>
  )
}


const file4 = () => {
  return (
    <View >
      <Text style={styles(WIDTH).text}>file</Text>
      <Component/>
    </View>
  )
}
    `;
    const stylesUsed = findStylesUsed(styleList, selection);
    expect(stylesUsed.length).toBe(2);
    expect(stylesUsed.find((item) => item.rootStyleName === 'componentStyle')).toBeDefined();
    expect(stylesUsed.find((item) => item.name === 'componentContainer')).toBeDefined();
    expect(stylesUsed.find((item) => item.rootStyleName === 'styles')).toBeDefined();
    expect(stylesUsed.find((item) => item.name === 'text')).toBeDefined();
  });
});

describe('checkSelectionIsValidStyle', () => {
  test('multi-line style is valid', () => {
    const selection = `style={{
      flex: 1,
      backgroundColor: 'red',
    }}`;
    const isValidStyle = checkSelectionIsValidStyle(selection);
    expect(isValidStyle).toBe(true);
  });

  test('single line style is valid', () => {
    const selection = `style={{ flex: 1, backgroundColor: 'red'}}`;
    const isValidStyle = checkSelectionIsValidStyle(selection);
    expect(isValidStyle).toBe(true);
  });

  test('single line style invalid style', () => {
    const selection = `style={{ flex: , backgroundColor: }}`;
    const isValidStyle = checkSelectionIsValidStyle(selection);
    expect(isValidStyle).toBe(false);
  });

  test('when style is more than 1 layer deep', () => {
    const selection = `style={{ transform: [{scaleX: 2}], }}`;
    const isValidStyle = checkSelectionIsValidStyle(selection);
    expect(isValidStyle).toBe(true);
  });
});

describe('getStyleContents', () => {
  test('1 style', () => {
    const selection = `style={{ flex: 1 }}`;
    const styleForPasting = getStyleContents(selection);
    expect(styleForPasting).toEqual(['flex: 1']);
  });

  test('2 styles', () => {
    const selection = `style={{ flex: 1, width: '100%' }}`;
    const styleForPasting = getStyleContents(selection);
    expect(styleForPasting).toEqual(['flex: 1', "width: '100%'"]);
  });

  test('nested style', () => {
    const selection = `style={{ flex: 1, transform: [{scaleX: 2, scaleY: 4}] }}`;
    const styleForPasting = getStyleContents(selection);
    expect(styleForPasting).toEqual(['flex: 1', 'transform: [{scaleX: 2, scaleY: 4}]']);
  });
  test('nested style in multi-line', () => {
    const selection = `style={{
      flex: 1,
      backgroundColor: 'red',
      'transform: [{scaleX: 2, scaleY: 4}]'
    }}}`;
    const styleForPasting = getStyleContents(selection);
    expect(styleForPasting).toEqual(['flex: 1', "backgroundColor: 'red'", "'transform: [{scaleX: 2, scaleY: 4}]'}"]);
  });

  describe('findFiles', () => {
    test('find all files in directory - no nested', () => {
      const folderPath = path.join(__dirname, 'src', 'test', 'resources', 'batch-clean');
      const files = findFiles(folderPath);
      expect(files.length).toBe(6);
    });

    test('find all files in directory - nested', () => {
      const folderPath = path.join(__dirname, 'src', 'test', 'resources', 'batch-clean-nested');
      const files = findFiles(folderPath);
      expect(files.length).toBe(12);
    });
  });

  describe('get styles used given a file', () => {
    test('before.js', () => {
      const filePath = path.join(__dirname, 'src', 'test', 'resources', 'batch-clean', 'before', 'file1.js');
      const fileContent = fs.readFileSync(filePath, {
        encoding: 'utf-8',
      });
      const stylesRaw = getStyles(fileContent);
      const styleList = parseStyleFromArrayToList(stylesRaw);
      expect(styleList.length).toBeGreaterThan(0);
      expect(styleList[0].rootName).toBe('styles');
      expect(styleList[0].styles.length).toBe(2);
      expect(styleList[0].styles[0].name).toBe('container');
      expect(styleList[0].styles[1].name).toBe('text');
    });
  });
});

describe('Special syntax', () => {
  it('should extract style details correctly from StyleSheet.create with arrow function style definitions', () => {
    const code = `
          import { StyleSheet } from 'react-native';
          const styles = (Width) => StyleSheet.create({
            container: {
              flex: 1,
              padding: 20,
            },
            text: {
              fontSize: 16,
              color: 'blue',
            },
          });
        `;
    const result = getStyles(code);
    expect(result).toHaveLength(1);
    expect(result[0].rootName).toBe('styles');
    expect(result[0].styles).toHaveProperty('container');
    expect(result[0].styles).toHaveProperty('text');
    expect(result[0].styles.container.usage).toBe(0);
    expect(result[0].styles.text.usage).toBe(0);
  });
});

describe('Codium tests', () => {
  // Parse simple valid JavaScript/TypeScript code containing StyleSheet.create
  it('should extract style details correctly from StyleSheet.create', () => {
    const code = `
          import { StyleSheet } from 'react-native';
          const styles = StyleSheet.create({
            container: {
              flex: 1,
              padding: 20,
            },
            text: {
              fontSize: 16,
              color: 'blue',
            },
          });
        `;
    const result = getStyles(code);
    expect(result).toHaveLength(1);
    expect(result[0].rootName).toBe('styles');
    expect(result[0].styles).toHaveProperty('container');
    expect(result[0].styles).toHaveProperty('text');
    expect(result[0].styles.container.usage).toBe(0);
    expect(result[0].styles.text.usage).toBe(0);
  });

  // Handle input with no style definitions
  it('should return an empty array when no style definitions are present', () => {
    const code = `
          const number = 42;
          function sayHello() {
            console.log('Hello');
          }
        `;
    const result = getStyles(code);
    expect(result).toHaveLength(0);
  });

  // Correctly extract style names and initial values from StyleSheet.create calls
  it('should extract style details correctly from StyleSheet.create', () => {
    const code = `
          import { StyleSheet } from 'react-native';
          const styles = StyleSheet.create({
            container: {
              flex: 1,
              padding: 20,
            },
            text: {
              fontSize: 16,
              color: 'blue',
            },
          });
        `;
    const result = getStyles(code);
    expect(result).toHaveLength(1);
    expect(result[0].rootName).toBe('styles');
    expect(result[0].styles).toHaveProperty('container');
    expect(result[0].styles).toHaveProperty('text');
    expect(result[0].styles.container.usage).toBe(0);
    expect(result[0].styles.text.usage).toBe(0);
  });

  // Process files where StyleSheet is not imported or used
  it('should return an empty array when StyleSheet is not imported or used', () => {
    const code = `
          const styles = {
            container: {
              flex: 1,
              padding: 20,
            },
            text: {
              fontSize: 16,
              color: 'blue',
            },
          };
        `;
    const result = getStyles(code);
    expect(result).toHaveLength(0);
  });

  // Correctly calculate usage counts for each style property in the source code
  it('should calculate usage counts for each style property in the source code', () => {
    const code = `
          import { StyleSheet } from 'react-native';
          const styles = StyleSheet.create({
            container: {
              flex: 1,
              padding: 20,
            },
            text: {
              fontSize: 16,
              color: 'blue',
            },
          });
        `;
    const result = getStyles(code);
    expect(result).toHaveLength(1);
    expect(result[0].rootName).toBe('styles');
    expect(result[0].styles).toHaveProperty('container');
    expect(result[0].styles).toHaveProperty('text');
    expect(result[0].styles.container.usage).toBe(0);
    expect(result[0].styles.text.usage).toBe(0);
  });

  // Process empty strings or null inputs without crashing
  it('should not crash when processing empty string', () => {
    const result = getStyles('');
    expect(result).toEqual([]);
  });
});

describe('detect inline styles', () => {
  it('case 1', () => {
    const text = `
    import { StyleSheet, Text, View } from 'react-native';
    import React from 'react';

    const file1 = () => {
      return (
        <View style={{ flex: 1, backgroundColor: 'red' }}>
            <View style={{marginHorizontal: 16, padding: 20, flexDirection: 'row'}}>...</View>
            <View style={{marginHorizontal: 16, padding: 20, flexDirection: 'row'}}>...</View>
        </View>
      );
    };

    export default file1;

    const styles = StyleSheet.create({
    });
`;

    const inlineStyles = detectInlineStyles(text);
    expect(inlineStyles).toContainEqual({
      usage: [`style={{marginHorizontal: 16, padding: 20, flexDirection: 'row'}}`, `style={{marginHorizontal: 16, padding: 20, flexDirection: 'row'}}`],
      styleObject: {
        marginHorizontal: 16,
        padding: 20,
        flexDirection: 'row',
      },
    });
  });

  it('case 2', () => {
    const text = `
    import { StyleSheet, Text, View } from 'react-native';
    import React from 'react';

    const file1 = () => {
      return (
        <View style={{ flex: 1, backgroundColor: 'red' }}>
            <View style={{flexDirection: 'row'}}>...</View>
            <View style={{flexDirection: 'row'}}>...</View>
        </View>
      );
    };

    export default file1;

    const styles = StyleSheet.create({
    });
`;

    const inlineStyles = detectInlineStyles(text);
    expect(inlineStyles).toContainEqual({
      usage: [`style={{flexDirection: 'row'}}`, `style={{flexDirection: 'row'}}`],
      styleObject: {
        flexDirection: 'row',
      },
    });
  });

  it('case 3', () => {
    const text = `
    import { StyleSheet, Text, View } from 'react-native';
    import React from 'react';

    const file1 = () => {
      return (
       <View
        style={{
          marginHorizontal: 16,
          padding: 20,
          flexDirection: 'row',
        }}
      >
        ...
      </View>
      <View
        style={{
          marginHorizontal: 16,
          padding: 20,
          flexDirection: 'row',
        }}
      >
        ...
      </View>
      );
    };

    export default file1;

    const styles = StyleSheet.create({
    });
`;

    const inlineStyles = detectInlineStyles(text);
    expect(inlineStyles).toContainEqual({
      usage: [
        `style={{
          marginHorizontal: 16,
          padding: 20,
          flexDirection: 'row',
        }}`,
        `style={{
          marginHorizontal: 16,
          padding: 20,
          flexDirection: 'row',
        }}`,
      ],
      styleObject: {
        marginHorizontal: 16,
        padding: 20,
        flexDirection: 'row',
      },
    });
  });
});

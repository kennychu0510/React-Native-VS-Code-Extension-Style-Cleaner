import { expect, test, describe } from 'vitest';
import { checkSelectionIsValidStyle, findStylesUsed, getStyles, parseStyleFromArrayToList, formatStyleForPasting, getStyleContents } from '../helper';
import fs from 'fs';
import path from 'path'

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
    expect(containerStyleIsUsed).toBeDefined();
    expect(textStyleIsUsed).toBeDefined();
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
    console.log(styleForPasting)
    expect(styleForPasting).toEqual(['flex: 1']);
  });

  test('2 styles', () => {
    const selection = `style={{ flex: 1, width: '100%' }}`;
    const styleForPasting = getStyleContents(selection);
    expect(styleForPasting).toEqual(['flex: 1', "width: '100%'"]);
  });

  test.only('nested style', () => {
    const selection = `style={{ flex: 1, transform: [{scaleX: 2, scaleY: 4}] }}`;
    const styleForPasting = getStyleContents(selection);
    expect(styleForPasting).toEqual(['flex: 1', 'transform: [{scaleX: 2, scaleY: 4}]']);
  });
});
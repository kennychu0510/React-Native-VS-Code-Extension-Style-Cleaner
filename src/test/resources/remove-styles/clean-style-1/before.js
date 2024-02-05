import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const file1 = () => {
  return (
    <View style={styles.container}>
      <Text>file1</Text>
    </View>
  );
};

export default file1;

const styles = StyleSheet.create({
  text: {
    color: 'black',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: 'red',
  },
});

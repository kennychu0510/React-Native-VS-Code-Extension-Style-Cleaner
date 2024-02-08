import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const file1 = () => {
  return (
    <View>
      <Text>file1</Text>
    </View>
  );
};

export default file1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
  },
  text: {
    fontWeight: 'bold',
  },
});

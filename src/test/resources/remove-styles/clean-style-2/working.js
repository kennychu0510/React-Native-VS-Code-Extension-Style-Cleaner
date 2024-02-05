import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const file1 = () => {
  return (
    <View style={stylesA.container}>
      <Text style={stylesB.text}>file1</Text>
    </View>
  );
};

export default file1;

const stylesA = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
  },
});

const stylesB = StyleSheet.create({
  text: {
    fontWeight: 'bold'
  },
});
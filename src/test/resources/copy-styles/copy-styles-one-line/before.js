import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const file1 = () => {
  return (
    <View style={{ flex: 1, backgroundColor: 'red' }}>
      <Text style={styles.text}>file1</Text>
    </View>
  );
};

export default file1;

const styles = StyleSheet.create({
  text: {
    color: 'black',
    fontWeight: 'bold',
  },
});

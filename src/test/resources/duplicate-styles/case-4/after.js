import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const file1 = () => {
  return (
    <View style={{ flex: 1, backgroundColor: 'red' }}>
      <View style={styles.consolidatedStyle_1}>...</View>
      <View
        style={styles.consolidatedStyle_1}
      >
        ...
      </View>
      <Text style={styles.consolidatedStyle_2}>...</Text>
      <Text style={styles.consolidatedStyle_2}>...</Text>
    </View>
  );
};

export default file1;

const styles = StyleSheet.create({
  consolidatedStyle_1: {
    marginHorizontal: 16,
    padding: 20,
    flexDirection: 'row',
  },
  consolidatedStyle_2: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const file1 = () => {
  return (
    <View style={{ flex: 1, backgroundColor: 'red' }}>
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
    </View>
  );
};

export default file1;

const styles = StyleSheet.create({});

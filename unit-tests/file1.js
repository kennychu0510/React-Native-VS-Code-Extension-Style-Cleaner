import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const file1 = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>file1</Text>
    </View>
  )
}

export default file1

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red'
  },
  text: {
    color: 'black',
    fontWeight: 'bold'
  }
})
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const file2 = () => {
  return (
    <View>
      <Text>file2</Text>
    </View>
  )
}

export default file2

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
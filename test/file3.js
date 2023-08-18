import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React from 'react'
const WIDTH = Dimensions.get('window').width
const file3 = () => {
  return (
    <View style={styles(WIDTH).container}>
      <Text>file3</Text>
    </View>
  )
}

export default file3

const styles = (WIDTH) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red'
  },
  text: {
    color: 'black',
    fontWeight: 'bold'
  }
})
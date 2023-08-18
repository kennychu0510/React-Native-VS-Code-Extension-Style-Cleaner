import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React from 'react'
const WIDTH = Dimensions.get('window').width

const Component = () => {
  return (
    <View style={componentStyle.componentContainer}>
      <Text>file</Text>
    </View>
  )
}

const componentStyle = StyleSheet.create({
  componentContainer: {
    flex: 1,
    backgroundColor: 'red'
  },
  text: {
    color: 'black',
    fontWeight: 'bold'
  }
})

const file4 = () => {
  return (
    <View >
      <Text style={styles(WIDTH).text}>file</Text>
      <Component/>
    </View>
  )
}

export default file4

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
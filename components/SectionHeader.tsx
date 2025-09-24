// components/SectionHeader.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { COLORS } from '../constants/GlobalStyles';


interface Props {
  title: string
}

export default function SectionHeader({ title }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{title.toUpperCase()}</Text>
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.color444,
  },
  text: {
    color: COLORS.color00B0FF,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
})

import { useEffect, useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

export default function LastSetBanner() {
  const [set, setSet] = useState<any>(null)

  useEffect(() => {
    const fetchLastSet = async () => {
      const { data: sets } = await supabase
        .from('sets')
        .select('name, banner_url, group_id')
        .order('published_on', { ascending: false })

      if (!sets) return

      for (const s of sets) {
        if (!s.banner_url) continue

        const { data: cards } = await supabase
          .from('cards')
          .select('id')
          .eq('group_id', s.group_id)
          .limit(1)

        if (cards && cards.length > 0) {
          setSet(s)
          return
        }
      }
    }

    fetchLastSet()
  }, [])

  if (!set || !set.banner_url) return null

  return (
    <TouchableOpacity
      onPress={() => router.push(`/search?set=${encodeURIComponent(set.group_id)}`)}
      style={styles.container}
    >
      <ImageBackground
        source={{ uri: set.banner_url }}
        style={StyleSheet.absoluteFill}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.content}>
          <Text style={styles.label}>NUEVO SET</Text>
          <Text style={styles.title}>{set.name}</Text>
          <Button mode="contained" style={styles.button} buttonColor="#00B0FF">
            Ver cartas
          </Button>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 140,
  },
  image: {
    borderRadius: 12,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  label: {
    color: '#00B0FF',
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 8,
    width: 130,
  },
})

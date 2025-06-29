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
          colors={['rgba(10,15,28,0.3)', 'rgba(10,15,28,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.content}>
          <Text style={styles.label}>NUEVO SET</Text>
          <Text style={styles.title}>{set.name}</Text>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            buttonColor="#00C8FF"
          >
            Ver cartas
          </Button>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    elevation: 4,
    backgroundColor: '#1C1C2E',
  },
  image: {
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  label: {
    color: '#00C8FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: '#00000088',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  button: {
    marginTop: 12,
    borderRadius: 50,
    width: 140,
  },
  buttonLabel: {
    fontWeight: 'bold',
    color: '#0A0F1C',
  },
})

import { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

export default function MostSoldSection() {
  const [cards, setCards] = useState<any[]>([])

  useEffect(() => {
    const fetchTopSelling = async () => {
      const { data, error } = await supabase.rpc('top_sold_cards_last_30_days')
      if (!error) {
        setCards(data || [])
      } else {
        console.error('Error fetching top selling cards:', error)
      }
    }

    fetchTopSelling()
  }, [])

  if (!cards.length) return null

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={cards}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/card/[id]', params: { ...item, id: item.id.toString() } })
            }
          >
            <Card style={styles.card} elevation={3}>
              <Card.Cover
                source={{ uri: item.image_url }}
                style={styles.image}
              />
              <Card.Content>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.soldCount}>{item.sold_count} ventas</Text>
                <Text style={styles.price}>
                  ${item.min_price?.toFixed(2) || '0.00'}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingRight: 8,
  },
  card: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    height: 180,
    resizeMode: 'cover',
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
  },
  soldCount: {
    color: '#FFB300',
    fontSize: 11,
    marginTop: 2,
  },
  price: {
    color: '#00C8FF',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 4,
  },
})

import { useEffect, useState } from 'react'
import { View, FlatList, Image, useWindowDimensions, StyleSheet } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

type BanlistCard = {
  name: string
  id: number
  status_text: 'Forbidden' | 'Limited' | 'Semi-Limited'
  card_type: string
}

export default function BanlistScreen() {
  const [section, setSection] = useState<'Forbidden' | 'Limited' | 'Semi-Limited'>('Forbidden')
  const [cards, setCards] = useState<BanlistCard[]>([])
  const [loading, setLoading] = useState(true)

  const { width } = useWindowDimensions()
  const horizontalPadding = 16
  const spacing = 8
  const numColumns = width < 400 ? 2 : 3
  const CARD_WIDTH = (width - horizontalPadding * 2 - spacing * (numColumns - 1)) / numColumns

  useEffect(() => {
    const fetchBanlist = async () => {
      try {
        setLoading(true)
        const res = await fetch('https://ygoprodeck.com/api/banlist/getBanList.php?list=TCG&date=2025-04-07')
        const data = await res.json()
        setCards(data)
      } catch (e) {
        console.error('Error al obtener la Ban List:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchBanlist()
  }, [])

  const filtered = cards.filter((card) => card.status_text === section)

  const getBorderColor = (status: BanlistCard['status_text']) => {
    switch (status) {
      case 'Forbidden':
        return '#FF5252'
      case 'Limited':
        return '#FFB300'
      case 'Semi-Limited':
        return '#66BB6A'
      default:
        return '#FFFFFF'
    }
  }

  const renderItem = ({ item }: { item: BanlistCard }) => (
    <View style={[styles.cardContainer, { width: CARD_WIDTH }]}>
      <Image
        source={{ uri: `https://images.ygoprodeck.com/images/cards_small/${item.id}.jpg` }}
        style={[styles.cardImage, {
          width: CARD_WIDTH,
          height: CARD_WIDTH * 1.4,
          borderColor: getBorderColor(item.status_text),
        }]}
      />
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Lista de Cartas Prohibidas y Limitadas
        </Text>

        <View style={styles.buttonsRow}>
          <Button
            mode={section === 'Forbidden' ? 'contained' : 'outlined'}
            buttonColor="#FF5252"
            onPress={() => setSection('Forbidden')}
          >
            Prohibidas
          </Button>
          <Button
            mode={section === 'Limited' ? 'contained' : 'outlined'}
            buttonColor="#FFB300"
            onPress={() => setSection('Limited')}
          >
            Limitadas
          </Button>
          <Button
            mode={section === 'Semi-Limited' ? 'contained' : 'outlined'}
            buttonColor="#66BB6A"
            onPress={() => setSection('Semi-Limited')}
          >
            Semi-limitadas
          </Button>
        </View>

        {loading ? (
          <ActivityIndicator animating={true} color="#00B0FF" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            numColumns={numColumns}
            contentContainerStyle={{ paddingBottom: 80 }}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  cardContainer: {
    alignItems: 'center',
  },
  cardImage: {
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 2,
    resizeMode: 'cover',
  },
  cardName: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
  },
})

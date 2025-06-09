import { useEffect, useState } from 'react'
import { View, FlatList, Image, Dimensions } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'

type BanlistCard = {
  name: string
  id: number
  status_text: 'Forbidden' | 'Limited' | 'Semi-Limited'
  card_type: string
}

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 3

export default function BanlistScreen() {
  const [section, setSection] = useState<'Forbidden' | 'Limited' | 'Semi-Limited'>('Forbidden')
  const [cards, setCards] = useState<BanlistCard[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
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
    <View style={{ width: CARD_WIDTH, margin: 4, alignItems: 'center' }}>
      <Image
        source={{ uri: `https://images.ygoprodeck.com/images/cards_small/${item.id}.jpg` }}
        style={{
          width: CARD_WIDTH,
          height: CARD_WIDTH * 1.4,
          borderRadius: 6,
          marginBottom: 4,
          borderWidth: 2,
          borderColor: getBorderColor(item.status_text),
        }}
      />
      <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>{item.name}</Text>
    </View>
  )  

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 16 }}>
      <Text variant="titleLarge" style={{ color: 'white', marginBottom: 12 }}>
        Lista de Cartas Prohibidas y Limitadas
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
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
          numColumns={3}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  )
}

import { useEffect, useState } from 'react'
import { View, FlatList, Image } from 'react-native'
import { Text, ActivityIndicator, ProgressBar } from 'react-native-paper'
import { TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'


type DeckEntry = {
  name: string
  decksCount: number
  deckTypeId: string
}

export default function MetaGameScreen() {
  const [decks, setDecks] = useState<DeckEntry[]>([])
  const [totalDecks, setTotalDecks] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()


  const fetchTierList = async () => {
    try {
      setLoading(true)
      const res = await fetch('https://www.yugiohmeta.com/api/v1/deck-types/rankings?ocg=false&t3Only=false&range=Last%201%20week&limit=1')
      const json = await res.json()

      const total = json[0]?.totalDecks || 0
      const mappedDecks: DeckEntry[] = json[0]?.deckTypes.map((d: any) => ({
        name: d.deckType.name,
        decksCount: d.decksCount,
        deckTypeId: d.deckType._id,
      }))

      setDecks(mappedDecks)
      setTotalDecks(total)
    } catch (e) {
      console.error('Error al obtener la Tier List:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTierList()
  }, [])

  const renderItem = ({ item }: { item: DeckEntry }) => {
    const imageUrl = `https://imgserv.yugiohmeta.com/v2/ygo/deck-type/${encodeURIComponent(item.name)}?portrait=true&width=80`
    const usage = ((item.decksCount / totalDecks) * 100).toFixed(1)
    const progress = item.decksCount / totalDecks

    return (
      <TouchableOpacity onPress={() => router.push(`/decklist/${item.deckTypeId}?name=${encodeURIComponent(item.name)}`)}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#BFCED6',
            borderRadius: 8,
            marginBottom: 12,
            alignItems: 'center',
            overflow: 'hidden',
            padding: 8,
          }}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: 60,
              height: 60,
              marginRight: 12,
              borderRadius: 4,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 16,
                color: '#1C1C1C',
                textTransform: 'uppercase',
              }}
            >
              {item.name}
            </Text>
            <Text style={{ color: '#444', fontSize: 12 }}>Uso: {usage}%</Text>
            <ProgressBar progress={progress} color="#00B0FF" style={{ marginTop: 4, height: 6, borderRadius: 3 }} />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 16 }}>
      <Text variant="titleLarge" style={{ color: 'white', marginBottom: 16 }}>
        Tier List - Última Semana
      </Text>

      {loading ? (
        <ActivityIndicator animating={true} color="#00B0FF" />
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  )
}

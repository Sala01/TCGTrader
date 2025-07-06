import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { View, Image, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'
import ZoomCardDialog from '@/components/ZoomCardDialog'


interface DeckCard {
  card: {
    _id: string
    name: string
    usdPrice: number | null
  }
  amount: number
}

interface Deck {
  _id: string
  author: string
  created: string
  main: DeckCard[]
  extra: DeckCard[]
  side: DeckCard[]
  event: {
    name: string
  }
  deckType: {
    name: string
  }
  tournamentPlacement: number
}

export default function DeckListScreen() {
  const { deckTypeId } = useLocalSearchParams()
  const [section, setSection] = useState<'Main' | 'Extra' | 'Side'>('Main')
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState<number>(17)
  const [selectedCard, setSelectedCard] = useState<{ id: string; name: string } | null>(null)
  const [showZoom, setShowZoom] = useState(false)


  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=MXN')
      const data = await res.json()
      if (data?.rates?.MXN) {
        setExchangeRate(data.rates.MXN)
      }
    } catch (e) {
      console.warn('No se pudo obtener el tipo de cambio, usando valor por defecto.')
    }
  }

  useEffect(() => {
    fetchExchangeRate()
  }, [])


  const fetchDecks = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `https://www.yugiohmeta.com/api/v1/top-decks?ocg=false&incomplete=false&deckType=${deckTypeId}&limit=10&page=1&sort[illegal]=1&sort[created]=-1&sort[tournamentPlacement]=1`
      )
      const data = await res.json()
      setDecks(data)
    } catch (e) {
      console.error('Error al obtener decks:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (deckTypeId) fetchDecks()
  }, [deckTypeId])

  const getDeckTotalPrice = () => {
    const currentDeck = decks[0]
    if (!currentDeck) return { usd: 0, mxn: 0 }

    const cards = [...currentDeck.main, ...currentDeck.extra, ...currentDeck.side]
    const totalUSD = cards.reduce((sum, item) => {
      return sum + (item.card.usdPrice || 0) * item.amount
    }, 0)

    return {
      usd: totalUSD,
      mxn: totalUSD * exchangeRate,
    }
  }


  const getSectionData = (deck: Deck) => {
    switch (section) {
      case 'Main':
        return deck.main
      case 'Extra':
        return deck.extra
      case 'Side':
        return deck.side
    }
  }

  function getPlacementLabel(placement: number): string {
    if (placement === 1) return '🏆 Winner'
    if (placement === 2) return '🥈 2nd Place'
    if (placement === 3.5) return '🥉 3rd/4th Place'
    if (placement >= 5 && placement <= 8) return 'Top 8'
    if (placement >= 9 && placement <= 16) return 'Top 16'
    if (placement >= 17 && placement <= 32) return 'Top 32'
    return `Top ${placement}`
  }

  const renderGrid = (cards: DeckCard[]) => {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {cards.map((item) => (
          <TouchableOpacity
            key={item.card._id}
            onPress={() => {
              setSelectedCard({ id: item.card._id, name: item.card.name })
              setShowZoom(true)
            }}
            style={{ width: 80, alignItems: 'center' }}
          >
            <Image
              source={{
                uri: `https://s3.duellinksmeta.com/cards/${item.card._id}_w420.webp`,
              }}
              style={{
                width: 70,
                height: 100,
                borderRadius: 4,
                marginBottom: 4,
              }}
            />
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              x{item.amount}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }


  return (
    <View style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 16 }}>
      {loading ? (
        <ActivityIndicator animating={true} color="#00B0FF" />
      ) : decks.length > 0 ? (
        (() => {
          const { usd, mxn } = getDeckTotalPrice()
          return (
            <>
              <Text variant="titleLarge" style={{ color: 'white', marginBottom: 4 }}>
                {decks[0].deckType.name} - Top Decks
              </Text>
              <Text style={{ color: '#ccc', marginBottom: 12 }}>
                {decks[0].event.name} | Autor: {decks[0].author} | Puesto: {getPlacementLabel(decks[0].tournamentPlacement)}
              </Text>

              <Text style={{ color: '#00B0FF', marginBottom: 12 }}>
                💰 Costo estimado: ${usd.toFixed(2)} USD / ${mxn.toFixed(2)} MXN
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                <Button
                  mode={section === 'Main' ? 'contained' : 'outlined'}
                  buttonColor="#42A5F5"
                  onPress={() => setSection('Main')}
                >
                  Main
                </Button>
                <Button
                  mode={section === 'Extra' ? 'contained' : 'outlined'}
                  buttonColor="#AB47BC"
                  onPress={() => setSection('Extra')}
                >
                  Extra
                </Button>
                <Button
                  mode={section === 'Side' ? 'contained' : 'outlined'}
                  buttonColor="#66BB6A"
                  onPress={() => setSection('Side')}
                >
                  Side
                </Button>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                {renderGrid(getSectionData(decks[0]))}
              </ScrollView>
              <ZoomCardDialog
                visible={showZoom}
                card={selectedCard ? selectedCard : null}
                isDeckBuild={true}
                onClose={() => setShowZoom(false)}
              />

            </>
          )
        })()
      ) : (
        <Text style={{ color: 'white' }}>No se encontraron decks.</Text>
      )}
    </View>
  )
}

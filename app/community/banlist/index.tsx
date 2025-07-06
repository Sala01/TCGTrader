// @ts-nocheck
import { useEffect, useState } from 'react'
import { View, FlatList, Image, useWindowDimensions, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { Text, Button, ActivityIndicator, Portal, Dialog } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import ZoomCardDialog from '@/components/ZoomCardDialog'

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
  const [selectedCard, setSelectedCard] = useState<BanlistCard | null>(null)
  const screenWidth = Dimensions.get('window').width
  const DIALOG_WIDTH = screenWidth * 0.8

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

  function CustomTabs({
    options,
    selected,
    onSelect,
  }: {
    options: { key: string; label: string }[]
    selected: string
    onSelect: (key: string) => void
  }) {
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#1C1C2E',
          borderRadius: 32,
          marginHorizontal: 16,
          padding: 4,
          marginBottom: 16,
          justifyContent: 'space-between',
        }}
      >
        {options.map(({ key, label }) => (
          <Button
            key={key}
            mode="contained"
            onPress={() => onSelect(key)}
            buttonColor={selected === key ? '#00B0FF' : 'transparent'}
            textColor={selected === key ? '#fff' : '#BFCED6'}
            style={{
              flex: 1,
              marginHorizontal: 4,
              borderRadius: 24,
              elevation: selected === key ? 2 : 0,
              paddingVertical: 4,
            }}
            contentStyle={{ height: 40 }}
            labelStyle={{ fontSize: 13, textAlign: 'center' }}
          >
            {label}
          </Button>
        ))}
      </View>
    )
  }


  const renderItem = ({ item }: { item: BanlistCard }) => (
    <TouchableOpacity
      style={[styles.cardContainer, { width: CARD_WIDTH }]}
      onPress={() => setSelectedCard(item)}
    >
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
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <ZoomCardDialog
        visible={!!selectedCard}
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Lista de Cartas Prohibidas y Limitadas
        </Text>

        <CustomTabs
          options={[
            { key: 'Forbidden', label: '⛔️ Forbi' },
            { key: 'Limited', label: '⚠️ Limit' },
            { key: 'Semi-Limited', label: '✅ Semi' },
          ]}
          selected={section}
          onSelect={setSection}
        />

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
    gap: 8,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  tabButton: {
    borderRadius: 10,
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

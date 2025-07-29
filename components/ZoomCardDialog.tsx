// components/ZoomCardDialog.tsx
import React from 'react'
import { View, Dimensions, Image } from 'react-native'
import { Dialog, Portal, Button, Text } from 'react-native-paper'
import { router } from 'expo-router'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

type Props = {
  visible: boolean
  card: { id: string; name: string } | null
  onClose: () => void
  isDeckBuild?: boolean
}

export default function ZoomCardDialog({ visible, card, onClose, isDeckBuild = false }: Props) {
  if (!card) return null

  const imageUrl = isDeckBuild
    ? `https://s3.duellinksmeta.com/cards/${card.id}_w420.webp`
    : `https://images.ygoprodeck.com/images/cards/${card.id}.jpg`

  const handleSearch = () => {
    onClose()
    router.push(`/search?query=${encodeURIComponent(card.name)}`)
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={{
          backgroundColor: '#1C1C2E',
          width: SCREEN_WIDTH * 0.95,
          height: SCREEN_HEIGHT * 0.75,
          alignSelf: 'center',
          padding: 0,
        }}
      >
        <View style={{ flex: 1, alignItems: 'center', padding: 12 }}>
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: SCREEN_WIDTH * 0.85,
              height: SCREEN_HEIGHT * 0.55,
              borderRadius: 8,
              resizeMode: 'contain',
            }}
          />

          <Text
            style={{
              color: 'white',
              marginTop: 12,
              fontSize: 16,
              textAlign: 'center',
            }}
            numberOfLines={2}
          >
            {card.name}
          </Text>

          <Button
            icon="magnify"
            mode="outlined"
            textColor="#00B0FF"
            style={{ marginTop: 8 }}
            onPress={handleSearch}
          >
            Buscar carta
          </Button>
        </View>
      </Dialog>
    </Portal>
  )
}

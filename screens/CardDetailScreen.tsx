// screens/CardDetailScreen.tsx
import { RouteProp, useRoute } from '@react-navigation/native'
import { View, ScrollView, Image } from 'react-native'
import { Text, Card, Divider, Title, Subheading } from 'react-native-paper'

type CardDetailParams = {
  params: {
    card: {
      name: string
      image_url: string
      set: string
      rarity: string
      description: string
      number: string
      attribute: string
      monster_type: string
      card_type: string
      attack: number
      defense: number
    }
  }
}

export default function CardDetailScreen() {
  const { params } = useRoute<RouteProp<CardDetailParams, 'params'>>()
  const card = params.card

  return (
    <ScrollView style={{ padding: 16, backgroundColor: '#0A0F1C' }}>
      <Card>
        <Card.Cover source={{ uri: card.image_url }} />
        <Card.Title title={card.name} subtitle={`${card.set} • ${card.rarity}`} />
      </Card>

      <View style={{ marginTop: 16 }}>
        <Title>Product Details</Title>
        <Text>{card.description}</Text>

        <Divider style={{ marginVertical: 16 }} />

        <Subheading>Stats</Subheading>
        <Text>Number: {card.number}</Text>
        <Text>Attribute: {card.attribute}</Text>
        <Text>Type: {card.monster_type}</Text>
        <Text>Card Type: {card.card_type}</Text>
        <Text>ATK: {card.attack} / DEF: {card.defense}</Text>
      </View>
    </ScrollView>
  )
}

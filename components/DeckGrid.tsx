import { View, Image, Text } from 'react-native'
import { COLORS } from '../constants/GlobalStyles';


export default function DeckGrid({ cards }: { cards: any[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {cards.map((card, idx) => (
        <View key={`${card.card._id}-${idx}`} style={{ width: 100, position: 'relative' }}>
          <Image
            source={{ uri: `https://s3.duellinksmeta.com/cards/${card.card._id}_w420.webp` }}
            style={{ width: 100, height: 140, borderRadius: 6 }}
            resizeMode="cover"
          />
          <View style={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.7)',
            paddingHorizontal: 4,
            borderRadius: 4
          }}>
            <Text style={{ color: COLORS.white, fontSize: 12 }}>x{card.amount}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

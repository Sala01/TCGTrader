import { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Subheading } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

export default function MostSoldSection() {
    const [cards, setCards] = useState<any[]>([])

    useEffect(() => {
        const fetchTopSelling = async () => {
            const { data, error } = await supabase
                .rpc('top_sold_cards_last_30_days') // 👈 usamos la función SQL

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
        <View style={{ marginTop: 24 }}>
            <FlatList
                horizontal
                data={cards}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/card/[id]', params: { ...item, id: item.id.toString() } })}
                    >
                        <Card style={{ width: 160, marginRight: 12, backgroundColor: '#1C1C2E' }}>
                            <Card.Cover source={{ uri: item.image_url }} style={{ height: 180 }} />
                            <Card.Content>
                                <Text style={{ color: 'white', fontWeight: 'bold' }} numberOfLines={2}>{item.name}</Text>
                                <Text style={{ color: '#ccc', fontSize: 12 }}>{item.sold_count} ventas</Text>
                                <Text style={{ color: '#00B0FF', fontSize: 13 }}>${item.min_price?.toFixed(2) || '0.00'}</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

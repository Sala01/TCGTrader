// app/search/index.tsx
import { useEffect, useState } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { FlatList, View, Image, TextInput, Keyboard } from 'react-native'
import { Text, Card, ActivityIndicator, Divider } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { COLORS } from '../../constants/GlobalStyles';


interface CardItem {
    id: number
    name: string
    rarity: string
    number: string
    card_type: string
    image_url: string
    attribute: string
    monster_type: string
    attack: number
    defense: number
    description: string
}

export default function SearchScreen() {
    const { query, set: setId } = useLocalSearchParams<{ query?: string; set?: string }>()
    const [results, setResults] = useState<CardItem[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [errorImages, setErrorImages] = useState<{ [id: number]: boolean }>({})
    const [inventoryCounts, setInventoryCounts] = useState<{ [cardId: number]: number }>({})

    const pageSize = 20
    const fallbackUrl = 'https://static.wikia.nocookie.net/yugioh/images/8/85/TheWingedDragonofRa-GBI-AE-Back.png/revision/latest?cb=20120824234540'

    const fetchResults = async (reset = false) => {
        if (loading || (!hasMore && !reset)) return

        setLoading(true)

        const from = reset ? 0 : page * pageSize
        const to = from + pageSize - 1

        const baseQuery = supabase
            .from('cards')
            .select('id, name, rarity, number, card_type, image_url, attribute, monster_type, attack, defense, description')
            .range(from, to)

        let finalQuery = baseQuery

        if (query) {
            finalQuery = finalQuery.or(`name.ilike.%${query}%,number.ilike.%${query}%`)
        }

        if (setId) {
            finalQuery = finalQuery.eq('group_id', setId)
        }

        const { data, error } = await finalQuery


        if (!error) {
            if (reset) {
                setResults(data)
            } else {
                setResults((prev) => [...prev, ...data])
            }
            const ids = (reset ? data : [...results, ...data]).map((c) => c.id)
            fetchInventoryCounts(ids)

            setHasMore(data.length === pageSize)
            setPage((prev) => (reset ? 1 : prev + 1))
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchResults(true)
    }, [query])

    const fetchInventoryCounts = async (cardIds: number[]) => {
        const { data, error } = await supabase
            .from('inventory')
            .select('card_id, count:id', { count: 'exact', head: false })
            .in('card_id', cardIds)
            .eq('estatus', 'activa')


        if (!error && data) {
            const counts: { [cardId: number]: number } = {}

            data.forEach((item) => {
                const id = item.card_id
                counts[id] = (counts[id] || 0) + 1
            })

            setInventoryCounts(counts)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.color0A0F1C, padding: 12 }}>
            <TextInput
                value={query as string}
                editable={false}
                placeholder="Buscar cartas"
                placeholderTextColor={COLORS.gray}
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
                style={{
                    backgroundColor: COLORS.color1C1C2E,
                    borderRadius: 8,
                    padding: 12,
                    color: COLORS.white,
                    marginBottom: 12,
                }}
            />

            <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 16 }}
                onEndReached={() => fetchResults()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
                renderItem={({ item }) => (
                    <Card
                        style={{ marginBottom: 12, backgroundColor: COLORS.color151526 }}
                        onPress={() =>
                            router.push({ pathname: '/card/[id]', params: { ...item, id: item.id.toString() } })
                        }
                    >
                        <View style={{ flexDirection: 'row' }}>
                            <Image
                                source={{ uri: !errorImages[item.id] && item.image_url ? item.image_url : fallbackUrl }}
                                onError={() => setErrorImages((prev) => ({ ...prev, [item.id]: true }))}
                                style={{ width: 100, height: 140, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}
                            />
                            <View style={{ flex: 1, padding: 12 }}>
                                <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>{item.name}</Text>
                                <Text style={{ color: COLORS.colorAAA, marginTop: 4 }}>{item.number}</Text>
                                <Text style={{ color: COLORS.colorCCC }}>{item.rarity}</Text>
                                <Text style={{ color: COLORS.color00FFAA, marginTop: 4 }}>
                                    Ofertas disponibles: {inventoryCounts[item.id] || 0}
                                </Text>

                            </View>
                        </View>
                    </Card>
                )}
                ItemSeparatorComponent={() => <Divider />}
            />
        </View>
    )
}

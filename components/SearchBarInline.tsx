import { useEffect, useState } from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import { TextInput, List, Divider } from 'react-native-paper'
import { supabase } from '@/lib/supabase'

interface Card {
    id: number
    name: string
    image_url: string
    number: string
    rarity: string
}

export default function SearchBarInline({
    onSelect,
    resetTrigger,
}: {
    onSelect: (card: Card) => void
    resetTrigger?: number
}) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Card[]>([])
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            setShowResults(false)
            return
        }

        const fetch = async () => {
            const { data } = await supabase
                .from('cards')
                .select('id, name, image_url, number, rarity')
                .ilike('name', `%${query}%`)
                .limit(10)

            setResults(data || [])
            setShowResults(true)
        }

        const delay = setTimeout(fetch, 300)
        return () => clearTimeout(delay)
    }, [query])


    useEffect(() => {
        setQuery('')
        setResults([])
    }, [resetTrigger])

    return (
        <View style={{ marginBottom: 8 }}>
            <TextInput
                label="Buscar carta"
                value={query}
                onChangeText={setQuery}
                mode="outlined"
                style={{ marginBottom: 8 }}
            />
            {showResults && results.length > 0 && (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    ItemSeparatorComponent={() => <Divider />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                setQuery('')
                                onSelect(item)
                                setShowResults(false)
                                setResults([])
                            }}
                        >
                            <List.Item
                                title={item.name}
                                description={`${item.number} • ${item.rarity}`}
                                titleStyle={{ color: 'white', fontWeight: 'bold' }}           // 👈 texto blanco
                                descriptionStyle={{ color: '#ccc' }}                          // 👈 descripción clara
                                left={(props) => (
                                    <List.Icon {...props} icon="cards" color="#00B0FF" />
                                )}
                            />
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    )
}

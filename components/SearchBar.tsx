import React, { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Keyboard  } from 'react-native'
import { TextInput, List, Divider, ActivityIndicator, useTheme, Surface } from 'react-native-paper'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

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

export default function SearchBar() {
  const theme = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('cards')
        .select('id, name, rarity, number, card_type, image_url, attribute, monster_type, attack, defense, description')
        .or(`name.ilike.%${query}%,number.ilike.%${query}%`)
        .limit(10)

      if (!error) {
        setResults(data || [])
      }
      setLoading(false)
    }

    const delay = setTimeout(fetch, 300)
    return () => clearTimeout(delay)
  }, [query])

  const onSelect = (card: CardItem) => {
    setQuery('')
    setResults([])
    router.push({
      pathname: '/card/[id]',
      params: {
        ...card,
        id: card.id.toString(), // esto sobrescribe el id con string
      }
    })
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <TextInput
        label="Buscar carta o set"
        value={query}
        onChangeText={setQuery}
        mode="outlined"
        returnKeyType="search"
        onSubmitEditing={() => {
          if (query.trim().length > 0) {
            setResults([])
            router.push(`/search?query=${encodeURIComponent(query.trim())}`)
          }
        }}
        left={<TextInput.Icon icon="magnify" />}
        right={
          query.length > 0 ? (
            <TextInput.Icon
              icon="close"
              onPress={() => {
                setQuery('')
                setResults([])
                Keyboard.dismiss()
              }}
            />
          ) : null
        }
        style={{ borderRadius: 12 }}
        theme={{
          colors: {
            primary: '#00B0FF',
            text: 'white',
            placeholder: 'gray',
            background: theme.colors.surface,
          },
        }}
      />

      {query.length >= 2 && (
        <Surface
          style={{
            marginTop: 4,
            backgroundColor: '#1C1C2E',
            borderRadius: 12,
            elevation: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator style={{ padding: 16 }} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSelect(item)}>
                  <List.Item
                    title={item.name}
                    description={`${item.number} • ${item.rarity}`}
                    titleStyle={{ color: 'white', fontWeight: 'bold' }}
                    descriptionStyle={{ color: '#bbb' }}
                    left={(props) => <List.Icon {...props} icon="cards" color="#00B0FF" />}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </Surface>
      )}
    </View>
  )
}

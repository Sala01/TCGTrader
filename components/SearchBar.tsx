import React, { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Keyboard } from 'react-native'
import {
  TextInput,
  List,
  Divider,
  ActivityIndicator,
  Surface,
} from 'react-native-paper'
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
        id: card.id.toString(),
      },
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
        textColor="#4FD2FF"
        outlineColor="#00AFFF"
        activeOutlineColor="#00C8FF"
        onSubmitEditing={() => {
          if (query.trim().length > 0) {
            router.push({ pathname: '/search', params: { query } })
            Keyboard.dismiss()
          }
        }}
        left={<TextInput.Icon icon="magnify" color="#00BFFF" />}
        right={
          <>
            {query.length > 0 && (
              <TextInput.Icon
                icon="close"
                onPress={() => {
                  setQuery('')
                  setResults([])
                  Keyboard.dismiss()
                }}
                color="#FFD700"
              />
            )}
            <TextInput.Icon
              icon="arrow-right"
              onPress={() => {
                if (query.trim().length > 0) {
                  router.push({ pathname: '/search', params: { query } })
                  Keyboard.dismiss()
                }
              }}
              color="#00FFAA"
            />
          </>
        }
        style={{
          borderRadius: 70,
          backgroundColor: '#1C1C2E',
        }}
        theme={{
          colors: {
            placeholder: '#7ED8FF',
            background: '#1C1C2E',
          },
        }}
      />


      {query.length >= 2 && (
        <Surface
          style={{
            marginTop: 8,
            backgroundColor: '#1C1C2E',
            borderRadius: 12,
            elevation: 6,
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <ActivityIndicator style={{ padding: 16 }} color="#00B0FF" />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <Divider style={{ backgroundColor: '#333' }} />}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSelect(item)}>
                  <List.Item
                    title={item.name}
                    description={`${item.number} • ${item.rarity}`}
                    titleStyle={{ color: '#fff', fontWeight: '600' }}
                    descriptionStyle={{ color: '#888' }}
                    left={(props) => (
                      <List.Icon {...props} icon="cards" color="#00B0FF" />
                    )}
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

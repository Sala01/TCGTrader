import React, { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Text, Card, Appbar, Chip, FAB } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import useUser from '@/hooks/useUser'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../../../constants/GlobalStyles';


export default function ForoScreen() {
  const [posts, setPosts] = useState<any[]>([])
  const [votes, setVotes] = useState<{ [key: string]: { likes: number; dislikes: number } }>({})
  const { user, loading } = useUser()

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.rpc('forum_posts_with_comment_count')
      if (!error && data) setPosts(data)
    }
    const fetchVotes = async () => {
      const { data } = await supabase.rpc('post_votes_summary')
      if (data) {
        const map: any = {}
        data.forEach((v: any) => {
          map[v.post_id] = { likes: v.likes, dislikes: v.dislikes }
        })
        setVotes(map)
      }
    }
    fetchPosts()
    fetchVotes()
  }, [])

  return (
    <View style={styles.container}>
      <Appbar.Header elevated mode="center-aligned" style={{ backgroundColor: COLORS.color0A0F1C }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Foro" titleStyle={{ color: COLORS.white }} />
      </Appbar.Header>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const votos = votes[item.id] || { likes: 0, dislikes: 0 }
          return (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/community/foro/[id]', params: { id: item.id } })}
              style={{ marginBottom: 16 }}
            >
              <Card style={{ backgroundColor: COLORS.color1C1C2E }}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Chip style={{ backgroundColor: COLORS.color00B0FF, marginRight: 8 }} textStyle={{ color: COLORS.color1C1C1C }}>
                      {item.categoria || 'General'}
                    </Chip>
                    <Text style={{ color: COLORS.color999, fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 16 }} numberOfLines={2}>{item.titulo}</Text>
                  <Text style={{ color: COLORS.colorCCC, fontSize: 14 }} numberOfLines={3}>{item.contenido}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ color: COLORS.color00B0FF }}>{item.comentarios_count} comentario(s)</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="thumb-up-outline" size={16} color={COLORS.color00B0FF} />
                        <Text style={{ color: COLORS.white, marginLeft: 4 }}>{votos.likes}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="thumb-down-outline" size={16} color={COLORS.colorD32F2F} />
                        <Text style={{ color: COLORS.white, marginLeft: 4 }}>{votos.dislikes}</Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={<Text style={{ color: COLORS.gray, textAlign: 'center', marginTop: 40 }}>No hay publicaciones aún.</Text>}
      />

      {!loading && user && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/community/foro/nuevo')}
          color={COLORS.color1C1C1C}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.color0A0F1C,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.color00B0FF,
  },
})

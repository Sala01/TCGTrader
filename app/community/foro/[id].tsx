import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Text, TextInput, Button, Appbar, Divider, IconButton } from 'react-native-paper'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import useUser from '@/hooks/useUser'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function PostDetalleScreen() {
  const { id } = useLocalSearchParams()
  const postId = Array.isArray(id) ? id[0] : id
  const [post, setPost] = useState<any>(null)
  const [comentarios, setComentarios] = useState<any[]>([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [votos, setVotos] = useState({ likes: 0, dislikes: 0 })
  const [miVoto, setMiVoto] = useState<null | 1 | -1>(null)
  const [snackbar, setSnackbar] = useState({ visible: false, text: '' })
  const [enviando, setEnviando] = useState(false)
  const [respuestas, setRespuestas] = useState<{ [key: string]: any[] }>({})
  const [mostrarRespuesta, setMostrarRespuesta] = useState<{ [key: string]: boolean }>({})
  const [textoRespuesta, setTextoRespuesta] = useState<{ [key: string]: string }>({})
  const [editandoComentario, setEditandoComentario] = useState<{ [key: string]: boolean }>({})
  const [textoEditado, setTextoEditado] = useState<{ [key: string]: string }>({})
  const { user } = useUser()

  useEffect(() => {
    const cargarPost = async () => {
      const { data } = await supabase.from('forum_posts').select('*').eq('id', postId).single()
      if (data) setPost(data)
    }

    const cargarComentarios = async () => {
      const { data } = await supabase
        .from('forum_comments')
        .select('id, contenido, user_id, created_at, users(username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (data) setComentarios(data)
    }

    const cargarRespuestas = async () => {
      const { data } = await supabase
        .from('forum_comment_replies')
        .select('id, contenido, comment_id, created_at, users(username)')
        .order('created_at')
      const agrupadas: { [key: string]: any[] } = {}
      data?.forEach((r) => {
        if (!agrupadas[r.comment_id]) agrupadas[r.comment_id] = []
        agrupadas[r.comment_id].push(r)
      })
      setRespuestas(agrupadas)
    }

    const cargarVotos = async () => {
      const { data } = await supabase.rpc('post_votes_summary')
      const resultado = data?.find((v: any) => v.post_id === postId)
      setVotos({ likes: resultado?.likes || 0, dislikes: resultado?.dislikes || 0 })

      if (user) {
        const { data: votoActual } = await supabase
          .from('forum_post_votes')
          .select('voto')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single()
        setMiVoto(votoActual?.voto ?? null)
      }
    }

    cargarPost()
    cargarComentarios()
    cargarVotos()
    cargarRespuestas()
  }, [postId, user])

  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return
    setEnviando(true)
    const { error } = await supabase.from('forum_comments').insert({
      post_id: postId,
      contenido: nuevoComentario,
      user_id: user.id,
    })
    if (!error) {
      setNuevoComentario('')
      const { data } = await supabase
        .from('forum_comments')
        .select('id, contenido, user_id, created_at, users(username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      setComentarios(data || [])
    } else {
      console.log("error coments", error);
    }
    setEnviando(false)
  }

  const enviarRespuesta = async (commentId: string) => {
    const contenido = textoRespuesta[commentId]
    if (!contenido || !contenido.trim()) return
    const { error } = await supabase.from('forum_comment_replies').insert({
      comment_id: commentId,
      user_id: user.id,
      contenido,
    })
    if (!error) {
      setTextoRespuesta((prev) => ({ ...prev, [commentId]: '' }))
      setMostrarRespuesta((prev) => ({ ...prev, [commentId]: false }))
      const { data } = await supabase
        .from('forum_comment_replies')
        .select('id, contenido, comment_id, created_at, users(username)')
        .eq('comment_id', commentId)
        .order('created_at')
      setRespuestas((prev) => ({ ...prev, [commentId]: data || [] }))
    }
  }

  const editarComentario = async (commentId: string) => {
    const nuevoTexto = textoEditado[commentId]
    const { error } = await supabase.from('forum_comments').update({ contenido: nuevoTexto }).eq('id', commentId)
    if (!error) {
      setEditandoComentario((prev) => ({ ...prev, [commentId]: false }))
      const { data } = await supabase
        .from('forum_comments')
        .select('id, contenido, user_id, created_at, users(username)')
        .eq('post_id', postId)
        .order('created_at')
      setComentarios(data || [])
    } else {
      console.log("error", error);
    }
  }

  const eliminarComentario = async (commentId: string) => {
    const { error } = await supabase.from('forum_comments').delete().eq('id', commentId)
    if (!error) {
      setComentarios((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  const votar = async (valor: 1 | -1) => {
    if (!user) {
      setSnackbar({ visible: true, text: 'Debes iniciar sesión para votar.' })
      return
    }
    if (miVoto === valor) return
    await supabase.from('forum_post_votes').upsert({
      post_id: postId,
      user_id: user.id,
      voto: valor,
    }, { onConflict: ['post_id', 'user_id'] })
    const { data } = await supabase.rpc('post_votes_summary')
    const resultado = data?.find((v: any) => v.post_id === postId)
    setVotos({ likes: resultado?.likes || 0, dislikes: resultado?.dislikes || 0 })
    setMiVoto(valor)
  }

  if (!post) return null

  return (
    <View style={styles.container}>
      <Appbar.Header elevated mode="center-aligned" style={{ backgroundColor: '#0A0F1C' }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Post" titleStyle={{ color: 'white' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.titulo}>{post.titulo}</Text>
        <Text style={styles.fecha}>{new Date(post.created_at).toLocaleString()}</Text>
        {post.imagen_url && (
          <Image source={{ uri: post.imagen_url }} style={styles.imagen} />
        )}
        <Text style={styles.contenido}>{post.contenido}</Text>

        <View style={{ flexDirection: 'row', gap: 16, marginVertical: 16 }}>
          <TouchableOpacity
            onPress={() => votar(1)}
            style={[styles.votoBtn, miVoto === 1 && { backgroundColor: '#004D80' }]}
          >
            <MaterialCommunityIcons
              name={miVoto === 1 ? 'thumb-up' : 'thumb-up-outline'}
              color="#00B0FF"
              size={20}
            />
            <Text style={styles.votoText}>{votos.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => votar(-1)}
            style={[styles.votoBtn, miVoto === -1 && { backgroundColor: '#5F1C1C' }]}
          >
            <MaterialCommunityIcons
              name={miVoto === -1 ? 'thumb-down' : 'thumb-down-outline'}
              color="#D32F2F"
              size={20}
            />
            <Text style={styles.votoText}>{votos.dislikes}</Text>
          </TouchableOpacity>
        </View>

        <Divider style={{ marginVertical: 24 }} />
        <Text style={styles.subtitulo}>Comentarios</Text>

        {comentarios.length === 0 && <Text style={{ color: '#ccc' }}>No hay comentarios aún.</Text>}

        {comentarios.map((c) => (
          <View key={c.id} style={{ marginBottom: 20 }}>
            <Text style={{ color: '#00B0FF', fontWeight: 'bold' }}>{c.users?.username || 'Usuario'}:</Text>
            {editandoComentario[c.id] ? (
              <>
                <TextInput
                  value={textoEditado[c.id] ?? c.contenido}
                  onChangeText={(text) => setTextoEditado((prev) => ({ ...prev, [c.id]: text }))}
                  style={{ backgroundColor: '#1C1C2E', color: 'white' }}
                  textColor="white"
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Button onPress={() => editarComentario(c.id)} compact>Guardar</Button>
                  <Button onPress={() => setEditandoComentario((prev) => ({ ...prev, [c.id]: false }))} compact>Cancelar</Button>
                </View>
              </>
            ) : (
              <Text style={{ color: 'white' }}>{c.contenido}</Text>
            )}
            <Text style={{ color: '#777', fontSize: 12 }}>{new Date(c.created_at).toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
              <Button onPress={() => setMostrarRespuesta((prev) => ({ ...prev, [c.id]: !prev[c.id] }))} compact>
                Responder
              </Button>
              {user?.id === c.user_id && !editandoComentario[c.id] && (
                <>
                  <Button onPress={() => setEditandoComentario((prev) => ({ ...prev, [c.id]: true }))} compact>Editar</Button>
                  <Button onPress={() => eliminarComentario(c.id)} compact>Borrar</Button>
                </>
              )}
            </View>
            {mostrarRespuesta[c.id] && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  label="Tu respuesta"
                  value={textoRespuesta[c.id] || ''}
                  onChangeText={(text) => setTextoRespuesta((prev) => ({ ...prev, [c.id]: text }))}
                  multiline
                  style={{ backgroundColor: '#1C1C2E', marginBottom: 8 }}
                  textColor="white"
                />
                <Button mode="contained" onPress={() => enviarRespuesta(c.id)} buttonColor="#00B0FF">
                  Enviar respuesta
                </Button>
              </View>
            )}
            {respuestas[c.id]?.map((r) => (
              <View key={r.id} style={{ marginTop: 12, marginLeft: 12, borderLeftWidth: 2, borderColor: '#444', paddingLeft: 8 }}>
                <Text style={{ color: '#00B0FF' }}>{r.users?.username || 'Usuario'}:</Text>
                <Text style={{ color: 'white' }}>{r.contenido}</Text>
                <Text style={{ color: '#777', fontSize: 12 }}>{new Date(r.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        ))}

        {user && (
          <View style={{ marginTop: 24 }}>
            <TextInput
              label="Agregar comentario"
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
              style={{ backgroundColor: '#1C1C2E', marginBottom: 12, color: 'white' }}
              textColor="white"
            />
            <Button mode="contained" onPress={enviarComentario} loading={enviando} disabled={enviando} buttonColor="#00B0FF">
              {enviando ? 'Enviando...' : 'Enviar'}
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  titulo: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contenido: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 12,
  },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginVertical: 12,
    resizeMode: 'cover',
  },
  fecha: {
    color: '#777',
    fontSize: 12,
  },
  subtitulo: {
    fontSize: 18,
    color: 'white',
    marginBottom: 12,
  },
  votoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  votoText: {
    color: 'white',
    marginLeft: 6,
  },
})

import { useState } from 'react'
import { View, ScrollView, Alert, Image, Platform } from 'react-native'
import { TextInput, Button, Text, Menu, Snackbar } from 'react-native-paper'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'
import { decode as atob } from 'base-64'
import { supabase } from '@/lib/supabase'
import useUser from '@/hooks/useUser'
import { router } from 'expo-router'

const categorias = ['General', 'Estrategia', 'Cartas', 'Torneos']

export default function NuevoPostScreen() {
  const { user } = useUser()
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [categoria, setCategoria] = useState('General')
  const [menuVisible, setMenuVisible] = useState(false)
  const [image, setImage] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, text: '', color: '#D32F2F' })

  const showSnackbar = (text: string, color = '#D32F2F') => {
    setSnackbar({ visible: true, text, color })
  }

  const compressIfNeeded = async (uri: string): Promise<string> => {
    const info = await FileSystem.getInfoAsync(uri)
    if (info.size && info.size > 1024 * 1024) {
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
      })
      return result.uri
    }
    return uri
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1 })
    if (!result.canceled) {
      const uri = await compressIfNeeded(result.assets[0].uri)
      setImage({ ...result.assets[0], uri })
    }
  }

  const handleSubmit = async () => {
    if (!titulo || !contenido) {
      return showSnackbar('El título y contenido son obligatorios')
    }
    setLoading(true)
    try {
      let imagen_url = null

      if (image) {
        const fileExt = image.uri.split('.').pop() || 'jpg'
        const fileName = `post-${user.id}-${Date.now()}.${fileExt}`
        const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: FileSystem.EncodingType.Base64 })
        const binary = atob(base64)
        const byteArray = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) byteArray[i] = binary.charCodeAt(i)

        const { error: uploadError } = await supabase.storage.from('forum-images').upload(fileName, byteArray, {
          contentType: `image/${fileExt}`,
        })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('forum-images').getPublicUrl(fileName)
        imagen_url = urlData.publicUrl
      }

      const { error } = await supabase.from('forum_posts').insert({
        titulo,
        contenido,
        categoria,
        user_id: user.id,
        imagen_url,
      })

      if (error) throw error
      showSnackbar('Post creado exitosamente', '#00B0FF')
      setTimeout(() => router.replace('/community/foro'), 1000)
    } catch (e) {
      console.error('Post Error', e)
      showSnackbar('Error al crear el post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#0A0F1C', flexGrow: 1 }}>
      <TextInput label="Título" value={titulo} onChangeText={setTitulo} style={{ marginBottom: 12 }} />
      <TextInput
        label="Contenido"
        value={contenido}
        onChangeText={setContenido}
        multiline
        numberOfLines={5}
        style={{ marginBottom: 12 }}
      />
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={<Button onPress={() => setMenuVisible(true)} mode="outlined" style={{ marginBottom: 12 }}>Categoría: {categoria}</Button>}
      >
        {categorias.map((cat) => (
          <Menu.Item key={cat} onPress={() => { setCategoria(cat); setMenuVisible(false) }} title={cat} />
        ))}
      </Menu>
      <Button mode="outlined" onPress={pickImage} style={{ marginBottom: 12 }}>
        {image ? 'Cambiar imagen' : 'Seleccionar imagen'}
      </Button>
      {image && <Image source={{ uri: image.uri }} style={{ height: 180, borderRadius: 8, marginBottom: 12 }} />}
      <Button mode="contained" onPress={handleSubmit} loading={loading} buttonColor="#00B0FF">
        Publicar
      </Button>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{ backgroundColor: snackbar.color, position: 'absolute', bottom: 20, left: 20, right: 20, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>{snackbar.text}</Text>
      </Snackbar>
    </ScrollView>
  )
}

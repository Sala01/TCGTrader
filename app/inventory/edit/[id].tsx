// app/inventory/edit/[id].tsx
import { useEffect, useState } from 'react'
import { View, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { TextInput, Button, Text, Menu } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import useUser from '@/hooks/useUser'
import { useLocalSearchParams, router } from 'expo-router'
import * as FileSystem from 'expo-file-system'
import { decode as atob } from 'base-64'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSnackbar } from '@/providers/SnackbarProvider'
import * as ImageManipulator from 'expo-image-manipulator'

const estados = ['NM', 'LP', 'MP', 'HP', 'D']

export default function EditInventoryScreen() {
  const { id } = useLocalSearchParams()
  const { user } = useUser()
  const [item, setItem] = useState<any>(null)
  const [precio, setPrecio] = useState('')
  const [estado, setEstado] = useState('NM')
  const [cantidad, setCantidad] = useState('1')
  const [image, setImage] = useState<any>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, cards(name, image_url, number, rarity)')
        .eq('id', id)
        .single()

      if (data) {
        setItem(data)
        setPrecio(String(data.precio))
        setCantidad(String(data.cantidad))
        setEstado(data.estado)
      }
    }

    if (id) fetchItem()
  }, [id])

  const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    quality: 1,
  })

  if (!result.canceled) {
    const original = result.assets[0]

    const manipulated = await ImageManipulator.manipulateAsync(
      original.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    )

    setImage({
      ...original,
      uri: manipulated.uri,
    })
  }
}

  const handleUpdate = async () => {
    let foto_url = item.foto_url

    if (image) {
      const fileUri = image.uri
      const fileExt = fileUri.split('.').pop() || 'jpg'
      const fileName = `${user.id}/${item.cards.number}_${Math.random()}.${fileExt}`

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const binary = atob(base64)
      const byteArray = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        byteArray[i] = binary.charCodeAt(i)
      }

      const { error: uploadError } = await supabase.storage
        .from('inventory-photos')
        .upload(fileName, byteArray, {
          contentType: `image/${fileExt}`,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('inventory-photos').getPublicUrl(fileName)
        foto_url = urlData.publicUrl
      }
    }

    const { error } = await supabase
      .from('inventory')
      .update({
        precio: parseFloat(precio),
        cantidad: parseInt(cantidad),
        estado,
        foto_url,
      })
      .eq('id', id)

    if (!error) {
      showSnackbar('Carta actualizada correctamente', '#00C853')
      router.back()
    } else {
      showSnackbar('Error al actualizar carta')
    }
  }

  if (!item) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 16 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', marginVertical: 12, backgroundColor: '#1C1C2E', borderRadius: 8, padding: 12 }}>
          <Image source={{ uri: item.cards.image_url }} style={{ width: 100, height: 140, borderRadius: 8, marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.cards.name}</Text>
            <Text style={{ color: '#aaa' }}>{item.cards.number}</Text>
            <Text style={{ color: '#00B0FF' }}>{item.cards.rarity}</Text>
          </View>
        </View>

        <TextInput
          label="Precio"
          value={precio}
          onChangeText={setPrecio}
          keyboardType="decimal-pad"
          style={{ marginBottom: 12 }}
        />

        <TextInput
          label="Cantidad"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          style={{ marginBottom: 12 }}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<Button onPress={() => setMenuVisible(true)} mode="outlined" style={{ marginBottom: 12 }}>Estado: {estado}</Button>}
        >
          {estados.map((e) => (
            <Menu.Item key={e} onPress={() => { setEstado(e); setMenuVisible(false) }} title={e} />
          ))}
        </Menu>

        <Button mode="outlined" onPress={pickImage} style={{ marginBottom: 12 }}>
          {image ? 'Cambiar foto' : 'Actualizar foto'}
        </Button>

        {image && <Image source={{ uri: image.uri }} style={{ height: 160, borderRadius: 8, marginBottom: 12 }} />}

        <Button mode="contained" onPress={handleUpdate} buttonColor="#00B0FF">
          Guardar cambios
        </Button>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
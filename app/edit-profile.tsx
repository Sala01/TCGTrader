import { useEffect, useState } from 'react'
import { View, Image, TouchableOpacity, Alert } from 'react-native'
import { Text, TextInput, Button, Menu, ActivityIndicator } from 'react-native-paper'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode as atob } from 'base-64'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'
import useUser from '@/hooks/useUser'

export default function EditProfileScreen() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [municipioId, setMunicipioId] = useState('')
  const [estados, setEstados] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<any[]>([])
  const [estadoMenuVisible, setEstadoMenuVisible] = useState(false)
  const [municipioMenuVisible, setMunicipioMenuVisible] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, avatar_url, estado_id, municipio_id')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
        } else if (userData) {
          setUsername(userData.username)
          setAvatarUrl(userData.avatar_url)
          setEstadoId(userData.estado_id?.toString() || '')
          setMunicipioId(userData.municipio_id?.toString() || '')
        }

        const { data: estadosData, error: estadosError } = await supabase
          .from('estados')
          .select('id, nombre')
          .order('nombre')

        if (estadosError) {
          console.error("Error fetching estados:", estadosError)
        } else {
          setEstados(estadosData || [])
        }

        setLoading(false)
      } catch (e) {
        console.error("Unexpected error:", e)
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    const fetchMunicipios = async () => {
      if (!estadoId) return
      const { data: municipiosData } = await supabase
        .from('municipios')
        .select('id, nombre')
        .eq('estado_id', estadoId)
        .order('nombre')

      setMunicipios(municipiosData || [])
    }

    fetchMunicipios()
  }, [estadoId])

  const handleAvatarChange = async () => {
    if (!user) return

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      const fileUri = result.assets[0].uri
      const fileExt = fileUri.split('.').pop() || 'jpg'
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

      console.log("filename", fileName);

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const binary = atob(base64)
      const byteArray = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        byteArray[i] = binary.charCodeAt(i)
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, byteArray, {
          contentType: `image/${fileExt}`,
          upsert: true,
        })

      if (uploadError) {
        console.error(uploadError)
        Alert.alert('Error al subir imagen')
        return
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(urlData.publicUrl)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    const { error } = await supabase
      .from('users')
      .update({
        username,
        avatar_url: avatarUrl,
        estado_id: parseInt(estadoId),
        municipio_id: parseInt(municipioId),
      })
      .eq('id', user.id)

    if (error) {
      Alert.alert('Error al guardar')
      console.error(error)
    } else {
      Alert.alert('Perfil actualizado')
    }

    setSaving(false)
  }

  if (loading || !user) {
    return (
      <AuthGuard>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#00B0FF" />
        </View>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: '#0A0F1C' }}>
        <TouchableOpacity onPress={handleAvatarChange}>
          <Image source={{ uri: avatarUrl }} style={{ width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 8 }} />
          <Text style={{ color: '#00B0FF', textAlign: 'center', marginBottom: 16 }}>Cambiar foto</Text>
        </TouchableOpacity>

        <TextInput
          label="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={{ backgroundColor: '#BFCED6', marginBottom: 12 }}
        />

        <Menu
          visible={estadoMenuVisible}
          onDismiss={() => setEstadoMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setEstadoMenuVisible(true)} style={{ marginBottom: 12 }}>
              {estadoId
                ? `Estado: ${estados.find((e) => e.id.toString() === estadoId)?.nombre}`
                : 'Seleccionar estado'}
            </Button>
          }
        >
          {estados.map((e) => (
            <Menu.Item
              key={e.id}
              onPress={() => {
                setEstadoId(e.id.toString())
                setEstadoMenuVisible(false)
                setMunicipioId('')
              }}
              title={e.nombre}
            />
          ))}
        </Menu>

        {estadoId && (
          <Menu
            visible={municipioMenuVisible}
            onDismiss={() => setMunicipioMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMunicipioMenuVisible(true)} style={{ marginBottom: 12 }}>
                {municipioId
                  ? `Municipio: ${municipios.find((m) => m.id.toString() === municipioId)?.nombre}`
                  : 'Seleccionar municipio'}
              </Button>
            }
          >
            {municipios.map((m) => (
              <Menu.Item
                key={m.id}
                onPress={() => {
                  setMunicipioId(m.id.toString())
                  setMunicipioMenuVisible(false)
                }}
                title={m.nombre}
              />
            ))}
          </Menu>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          buttonColor="#00B0FF"
        >
          Guardar cambios
        </Button>
      </SafeAreaView>
    </AuthGuard>
  )
}

import { useState, useEffect } from 'react'
import { View, Image, Alert, TouchableOpacity, FlatList, ScrollView } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { TextInput, Button, Text, Menu, Card } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import useUser from '@/hooks/useUser'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system'
import { decode as atob } from 'base-64'
import { useSnackbar } from '@/providers/SnackbarProvider'

const estados = ['NM', 'LP', 'MP', 'HP', 'D']

export default function AddInventoryForm() {
    const { user } = useUser()
    const [search, setSearch] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [selectedCard, setSelectedCard] = useState<any>(null)
    const [cantidad, setCantidad] = useState('1')
    const [precio, setPrecio] = useState('')
    const [estado, setEstado] = useState('NM')
    const [intercambiable, setIntercambiable] = useState(true)
    const [image, setImage] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const [menuVisible, setMenuVisible] = useState(false)
    const { showSnackbar } = useSnackbar()

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (search.length < 2) return setSuggestions([])

            const { data } = await supabase
                .from('cards')
                .select('id, name, image_url, number, rarity')
                .ilike('name', `%${search}%`)
                .limit(10)

            setSuggestions(data || [])
        }

        const timeout = setTimeout(fetchSuggestions, 300)
        return () => clearTimeout(timeout)
    }, [search])

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: false,
            quality: 0.8,
        })

        if (!result.canceled) {
            setImage(result.assets[0])
        }
    }

    const handleSave = async () => {
        if (!image) return showSnackbar('La foto es obligatoria')
        if (!selectedCard || !precio) return showSnackbar('Completa los campos requeridos')

        try {
            setUploading(true)
            const fileUri = image.uri
            const fileExt = fileUri.split('.').pop() || 'jpg'
            const fileName = `${user.id}/${selectedCard.number}_${Math.random()}.${fileExt}`

            const base64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            })

            // 2. Convertir a Uint8Array
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

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from('inventory-photos').getPublicUrl(fileName)
            const foto_url = urlData.publicUrl

            const { error } = await supabase.from('inventory').insert({
                user_id: user.id,
                card_id: selectedCard.id,
                cantidad: parseInt(cantidad),
                precio: parseFloat(precio),
                estado,
                intercambiable,
                foto_url,
            })

            if (error) throw error

            showSnackbar('¡Carta agregada al inventario!')
            setSelectedCard(null)
            setSearch('')
            setCantidad('1')
            setPrecio('')
            setImage(null)
        } catch (e) {
            console.error('Error al guardar:', e)
            showSnackbar('Error al guardar')
        } finally {
            setUploading(false)
        }
    }

    return (
        <SafeAreaView style={{ padding: 16 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                <TextInput
                    label="Buscar carta"
                    value={search}
                    onChangeText={setSearch}
                    mode="outlined"
                    style={{ marginBottom: 8 }}
                />

                {suggestions.length > 0 && !selectedCard && (
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedCard(item)
                                    setSearch(item.name)
                                }}
                            >
                                <Card style={{ marginVertical: 4, padding: 8, backgroundColor: '#1C1C2E' }}>
                                    <Text style={{ color: 'white' }}>{item.name}</Text>
                                </Card>
                            </TouchableOpacity>
                        )}
                    />
                )}

                {selectedCard && (
                    <View style={{ flexDirection: 'row', marginVertical: 12, backgroundColor: '#1C1C2E', borderRadius: 8, padding: 12 }}>
                        <Image source={{ uri: selectedCard.image_url }} style={{ width: 100, height: 140, borderRadius: 8, marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{selectedCard.name}</Text>
                            <Text style={{ color: '#aaa' }}>{selectedCard.number}</Text>
                            <Text style={{ color: '#00B0FF' }}>{selectedCard.rarity}</Text>
                        </View>
                    </View>
                )}

                <TextInput
                    label="Cantidad"
                    value={cantidad}
                    onChangeText={setCantidad}
                    keyboardType="numeric"
                    style={{ marginBottom: 12 }}
                />

                <TextInput
                    label="Precio"
                    value={precio}
                    onChangeText={setPrecio}
                    keyboardType="decimal-pad"
                    style={{ marginBottom: 12 }}
                />

                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <Button onPress={() => setMenuVisible(true)} mode="outlined" style={{ marginBottom: 12 }}>
                            Estado: {estado}
                        </Button>
                    }
                >
                    {estados.map((e) => (
                        <Menu.Item key={e} onPress={() => { setEstado(e); setMenuVisible(false) }} title={e} />
                    ))}
                </Menu>

                <Button mode="outlined" onPress={pickImage} style={{ marginBottom: 12 }}>
                    {image ? 'Cambiar foto' : 'Seleccionar foto'}
                </Button>

                {image && (
                    <Image source={{ uri: image.uri }} style={{ height: 160, borderRadius: 8, marginBottom: 12 }} />
                )}

                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={uploading}
                    disabled={uploading}
                    buttonColor="#00B0FF"
                >
                    Agregar al inventario
                </Button>
            </ScrollView>
        </SafeAreaView>
    )
}

import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Text, Button, ActivityIndicator, Snackbar } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { isAfter } from 'date-fns'
import { sendPushNotification } from '@/lib/sendPush'

export default function PujarScreen() {
    const { id } = useLocalSearchParams()
    const [loading, setLoading] = useState(true)
    const [inventario, setInventario] = useState<any>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [snackbar, setSnackbar] = useState({
        visible: false,
        text: '',
        color: '#D32F2F', // rojo por default
    })

    const showSnackbar = (text: string, color: string = '#D32F2F') => {
        setSnackbar({ visible: true, text, color })
    }


    useEffect(() => {
        const loadData = async () => {
            setLoading(true)

            const user = await supabase.auth.getUser()
            setUserId(user.data?.user?.id ?? null)

            const { data, error } = await supabase
                .from('inventory')
                .select('valor_actual, puja_minima, fecha_limite, users ( id )')
                .eq('id', id)
                .single()

            if (error || !data) {
                showSnackbar('No se pudo cargar la subasta.')
                router.replace('/')
            } else {
                setInventario(data)
            }

            setLoading(false)
        }

        loadData()
    }, [id])

    const handlePujar = async () => {
        if (!inventario || !userId) {
            showSnackbar('Necesitas estar registrado para poder pujar.')
            return
        }

        // 🔒 Validar que el usuario NO sea el dueño de la subasta
        if (inventario.users?.id === userId) {
            showSnackbar('No puedes pujar en tu propia subasta.')
            return
        }

        // ⏳ Validar que la subasta sigue activa
        const fechaLimite = new Date(inventario.fecha_limite)
        if (isAfter(new Date(), fechaLimite)) {
            showSnackbar('La subasta ya ha terminado.')
            router.replace({ pathname: '/subasta/[id]', params: { id } })
            return
        }

        // 🔁 Validar que no sea el mismo usuario que hizo la última puja
        const { data: pujasData } = await supabase
            .from('pujas')
            .select('user_id')
            .eq('inventario_id', id)
            .order('created_at', { ascending: false })
            .limit(1)

        if (pujasData?.[0]?.user_id === userId) {
            showSnackbar('No puedes pujar dos veces seguidas.')
            return
        }

        // 🧠 Revalidar el valor actual más reciente
        const { data: latest } = await supabase
            .from('inventory')
            .select('valor_actual')
            .eq('id', id)
            .single()

        if (!latest || latest.valor_actual > inventario.valor_actual) {
            showSnackbar(`El valor actual ahora es $${latest?.valor_actual}.`)
            router.replace({ pathname: '/subasta/[id]', params: { id } })
            return
        }

        // ✅ Calcular el nuevo monto
        const nuevoMonto = (inventario.valor_actual ?? 0) + (inventario.puja_minima ?? 0)

        const { error } = await supabase.from('pujas').insert({
            user_id: userId,
            inventario_id: id,
            monto: nuevoMonto,
        })

        if (error) {
            showSnackbar('No se pudo registrar la puja.')
        } else {
            showSnackbar(`Has pujado $${nuevoMonto}`, '#00B0FF')

            // 🔔 Notificar al dueño de la subasta
            const { data: subastaCompleta } = await supabase
                .from('inventory')
                .select('user_id, card_id, valor_actual')
                .eq('id', id)
                .single()

            const { data: carta } = await supabase
                .from('cards')
                .select('name')
                .eq('id', subastaCompleta?.card_id)
                .single()

            if (subastaCompleta?.user_id !== userId) {
                const { data: tokenData } = await supabase
                    .from('notification_tokens')
                    .select('expo_token')
                    .eq('user_id', subastaCompleta.user_id)
                    .single()

                if (tokenData?.expo_token) {
                    await sendPushNotification(
                        tokenData.expo_token,
                        'Nueva puja recibida',
                        `Se realizó una puja en tu subasta: ${carta?.name}. El valor actual es de: $${subastaCompleta.valor_actual}`
                    )
                }
            }

            router.replace({
                pathname: '/subasta/[id]',
                params: { id },
            })
        }

    }

    if (loading || !inventario) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#00B0FF" />
            </View>
        )
    }

    const nuevoValor = (inventario.valor_actual ?? 0) + (inventario.puja_minima ?? 0)

    return (
        <View style={styles.container}>
            <Text variant="titleLarge" style={styles.title}>Nueva Puja</Text>
            <Text style={styles.label}>Valor actual:</Text>
            <Text style={styles.value}>${inventario.valor_actual ?? 0}</Text>

            <Text style={styles.label}>Puja mínima:</Text>
            <Text style={styles.value}>+ ${inventario.puja_minima}</Text>

            <Text style={styles.label}>Total a registrar:</Text>
            <Text style={styles.valueFinal}>${nuevoValor}</Text>

            <Button
                mode="contained"
                icon="gavel"
                buttonColor="#00B0FF"
                textColor="#1C1C1C"
                style={styles.button}
                onPress={handlePujar}
            >
                Confirmar Puja
            </Button>
            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={3000}
                style={{
                    backgroundColor: snackbar.color,
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    borderRadius: 8,
                }}
            >
                <Text style={{ color: 'white', textAlign: 'center' }}>{snackbar.text}</Text>
            </Snackbar>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0A0F1C',
        flex: 1,
        padding: 20,
    },
    loading: {
        flex: 1,
        backgroundColor: '#0A0F1C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: '#BFCED6',
        fontSize: 22,
        marginBottom: 20,
        fontWeight: 'bold',
    },
    label: {
        color: '#888',
        marginTop: 12,
    },
    value: {
        color: '#FFF',
        fontSize: 18,
    },
    valueFinal: {
        color: '#00B0FF',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    button: {
        marginTop: 30,
        borderRadius: 10,
    },
})

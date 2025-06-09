import { useState, useCallback } from 'react'
import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native'
import {
  TextInput,
  Button,
  SegmentedButtons,
  Snackbar,
  Text,
} from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    visible: false,
    text: '',
    color: 'red',
    icon: 'alert-circle-outline',
  })

  const router = useRouter()
  const { redirected, returnTo } = useLocalSearchParams()

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (redirected === 'true') {
          router.replace('/')
          return true
        }
        return false
      }

      BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }, [redirected])
  )

  const showSnackbar = (
    text: string,
    color: string = 'red',
    icon: string = 'alert-circle-outline'
  ) => {
    setSnackbar({ visible: true, text, color, icon })
  }

  const validateFields = () => {
    if (!email || !password) {
      showSnackbar('Email y contraseña son obligatorios')
      return false
    }
    if (mode === 'register' && (!username || !nombre)) {
      showSnackbar('Nombre y nombre de usuario son obligatorios')
      return false
    }
    return true
  }

  const handleRegister = async () => {
    if (!validateFields()) return
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      showSnackbar(error.message)
    } else {
      const userId = data.user?.id
      if (userId) {
        const { error: userInsertError } = await supabase.from('users').insert({
          id: userId,
          username,
          nombre,
        })

        if (userInsertError) {
          showSnackbar('Error al registrar usuario', 'red', 'alert')
          console.error('Insert users error:', userInsertError)
        }
      } else {
        showSnackbar('No se pudo obtener el ID de usuario', 'red', 'account-alert')
      }

      if (data.session) {
        await AsyncStorage.setItem('session', JSON.stringify(data.session))
        router.replace(returnTo === 'profile' ? '/profile' : '/index')
      } else {
        showSnackbar('Confirma tu correo electrónico', '#00B0FF', 'email-alert')
      }
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!validateFields()) return
    setLoading(true)
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      showSnackbar(error.message)
    } else {
      await AsyncStorage.setItem('session', JSON.stringify(data.session))
      router.replace(returnTo === 'profile' ? '/profile' : '/index')
    }
    setLoading(false)
  }

  const handleSubmit = () => {
    mode === 'register' ? handleRegister() : handleLogin()
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0F1C' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={{
            width: 150,
            height: 150,
            alignSelf: 'center',
            marginBottom: 32,
          }}
        />

        <SegmentedButtons
          value={mode}
          onValueChange={(val) => setMode(val as 'login' | 'register')}
          buttons={[
            {
              value: 'login',
              label: 'Iniciar sesión',
              labelStyle: { color: mode === 'login' ? '#000' : '#FFF' },
            },
            {
              value: 'register',
              label: 'Registrarse',
              labelStyle: { color: mode === 'register' ? '#000' : '#FFF' },
            },
          ]}
          style={{ marginBottom: 16 }}
          theme={{ colors: { secondaryContainer: '#00B0FF' } }}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email" />}
          style={{ marginBottom: 12 }}
        />

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          left={<TextInput.Icon icon="lock" />}
          style={{ marginBottom: 12 }}
        />

        {mode === 'register' && (
          <>
            <TextInput
              label="Nombre de usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              left={<TextInput.Icon icon="account" />}
              style={{ marginBottom: 12 }}
            />

            <TextInput
              label="Nombre completo"
              value={nombre}
              onChangeText={setNombre}
              left={<TextInput.Icon icon="account-box" />}
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          buttonColor="#00B0FF"
          style={{ marginBottom: 12 }}
        >
          {mode === 'register' ? 'Registrarse' : 'Iniciar sesión'}
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor: snackbar.color,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={snackbar.icon as any}
          color="white"
          size={20}
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: 'white' }}>{snackbar.text}</Text>
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

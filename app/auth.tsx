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
  Text,
} from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useSnackbar } from '@/providers/SnackbarProvider'
import * as Linking from 'expo-linking'

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)
  const { showSnackbar } = useSnackbar()
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

  const handleRegister = async () => {
    if (!email || !password) {
      showSnackbar('Email y contraseña son obligatorios')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    setLoading(false)

    if (error) return showSnackbar(error.message)

    showSnackbar('Confirma tu correo electrónico antes de iniciar sesión', '#00B0FF')
  }

  const handleLogin = async () => {
    if (!email || !password) {
      showSnackbar('Email y contraseña son obligatorios')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)

    if (error) return showSnackbar(error.message)

    const user = data.user

    if (!user?.email_confirmed_at) {
      return showSnackbar('Debes verificar tu correo antes de iniciar sesión')
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!userRow) {
      setShowCompleteProfile(true)
    } else {
      await AsyncStorage.setItem('session', JSON.stringify(data.session))
      router.replace(returnTo === 'profile' ? '/profile' : '/index')
    }
  }

  const handleCompleteProfile = async () => {
    if (!username || !nombre) {
      return showSnackbar('Faltan datos del perfil')
    }

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id

    if (!userId) return showSnackbar('No se encontró sesión')

    const { error } = await supabase.from('users').insert({ id: userId, username, nombre })

    if (error) {
      console.error('Insert users error:', error)
      return showSnackbar('Error al guardar perfil')
    }

    const { data: sessionData } = await supabase.auth.getSession()
    await AsyncStorage.setItem('session', JSON.stringify(sessionData.session))
    router.replace(returnTo === 'profile' ? '/profile' : '/index')
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

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          buttonColor="#00B0FF"
          style={{ marginBottom: 12 }}
        >
          {mode === 'register' ? 'Registrarse' : 'Iniciar sesión'}
        </Button>

        {showCompleteProfile && (
          <>
            <Text style={{ color: 'white', marginBottom: 12, textAlign: 'center' }}>
              Completa tu perfil para continuar
            </Text>

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

            <Button
              mode="contained"
              onPress={handleCompleteProfile}
              loading={loading}
              buttonColor="#00B0FF"
            >
              Guardar perfil
            </Button>
          </>
        )}

        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 12 }}>
          Al registrarse, usted acepta que leyó el{' '}
          <Text
            style={{ color: '#00B0FF', textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL('https://onlycarry.com/tcgtraders/privacidad.html')}
          >
            aviso de privacidad
          </Text>{' '}
          y acepta los{' '}
          <Text
            style={{ color: '#00B0FF', textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL('https://onlycarry.com/tcgtraders/terminos.html')}
          >
            términos y condiciones
          </Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

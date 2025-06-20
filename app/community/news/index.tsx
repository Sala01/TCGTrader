import { useState, useEffect } from 'react'
import { View, TextInput, ScrollView, StyleSheet } from 'react-native'
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper'
import { askYugiohBot } from '@/lib/askYugiohBot'
import { canAskQuestion } from '@/lib/questionQuota'
import { SafeAreaView } from 'react-native-safe-area-context'
import AuthGuard from '@/components/AuthGuard'
import useUser from '@/hooks/useUser'

export default function ChatbotScreen() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { user } = useUser()

  useEffect(() => {
    if (!user) return
  }, [user])

  const handleAsk = async () => {
    if (!question.trim() || !user?.id) return
    setLoading(true)
    setAnswer('')
    setErrorMsg('')

    const check = await canAskQuestion(user.id)
    if (!check.allowed) {
      setErrorMsg(check.message)
      setLoading(false)
      return
    }

    const res = await askYugiohBot(question)
    setAnswer(res)
    setLoading(false)
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text variant="titleLarge" style={styles.title}>
            Ayuda de Yu-Gi-Oh!
          </Text>

          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="¿Cuál es tu duda sobre el juego?"
            placeholderTextColor="#aaa"
            style={styles.input}
            multiline
          />

          <Button mode="contained" onPress={handleAsk} disabled={loading} style={styles.button}>
            {loading ? 'Consultando...' : 'Preguntar'}
          </Button>

          {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

          {errorMsg !== '' && (
            <Text style={{ color: '#FFB300', marginTop: 16 }}>{errorMsg}</Text>
          )}

          {answer !== '' && (
            <Card style={styles.answerCard}>
              <Card.Content>
                <Text style={styles.answerText}>{answer}</Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1C' },
  title: { color: '#fff', marginBottom: 20, fontWeight: 'bold', fontSize: 22 },
  input: {
    backgroundColor: '#1C1C2E',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: { marginTop: 20, backgroundColor: '#00B0FF' },
  answerCard: { marginTop: 30, backgroundColor: '#1C1C2E' },
  answerText: { color: 'white' },
})

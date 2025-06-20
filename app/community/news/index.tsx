import { useState, useEffect } from 'react'
import { View, TextInput, FlatList, StyleSheet, Modal, Pressable } from 'react-native'
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper'
import { askYugiohBot } from '@/lib/askYugiohBot'
import { canAskQuestion } from '@/lib/questionQuota'
import { getQuestionHistory } from '@/lib/getQuestionHistory'
import { useIAP } from '@/lib/iap/useIAP'
import { SafeAreaView } from 'react-native-safe-area-context'
import AuthGuard from '@/components/AuthGuard'
import useUser from '@/hooks/useUser'

const PAGE_SIZE = 10

export default function ChatbotScreen() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [questionLimit, setQuestionLimit] = useState(10)
  const [questionsUsed, setQuestionsUsed] = useState(0)
  const [questionsRemain, setQuestionsRemain] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)

  const { user } = useUser()
  const { products, purchase, initialized } = useIAP()

  useEffect(() => {
    if (user?.id) {
      loadInitialHistory()
      checkQuota()
    }
  }, [user])

  const checkQuota = async () => {
    const check = await canAskQuestion(user.id)
    setQuestionsUsed(check.used)
    setQuestionLimit(check.limit)
    setQuestionsRemain(check.remaining)
  }

  const getQuotaColor = () => {
    if (questionLimit === 0) return '#fff'
    const ratio = questionsRemain / questionLimit
    if (ratio <= 0.6) return '#00FFAA'
    if (ratio <= 0.3) return '#FFB300'
    return '#FF4444'
  }

  const getLimitWarning = () => {
    if (questionsRemain <= 0) return 'Has alcanzado tu límite de preguntas por mes.'
    if (questionsRemain === 1) return '¡Solo te queda 1 pregunta este mes!'
    if (questionsRemain <= 3) return 'Te quedan pocas preguntas disponibles este mes.'
    if (questionsRemain < questionLimit) return 'Aprovecha tus preguntas, aún tienes disponibles.'
    return ''
  }

  const loadInitialHistory = async () => {
    const data = await getQuestionHistory(user.id, 0)
    setHistory(data)
    setPage(1)
    setHasMore(data.length === PAGE_SIZE)
  }

  const loadMoreHistory = async () => {
    if (!user?.id || loadingMore || !hasMore) return
    setLoadingMore(true)
    const data = await getQuestionHistory(user.id, page)
    setHistory((prev) => [...prev, ...data])
    setPage(page + 1)
    setHasMore(data.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  const handleAsk = async () => {
    if (!question.trim() || !user?.id) return
    setLoading(true)
    setErrorMsg('')

    const check = await canAskQuestion(user.id)
    setQuestionsUsed(check.used)
    setQuestionLimit(check.limit)
    setQuestionsRemain(check.remaining)

    if (!check.allowed) {
      setErrorMsg(check.message)
      setLoading(false)
      return
    }

    const res = await askYugiohBot(question, user.id)

    const newLog = {
      id: Date.now().toString(),
      question,
      answer: res,
      created_at: new Date().toISOString(),
    }

    setHistory([newLog, ...history])
    setQuestion('')
    setLoading(false)
  }

  const handleSubscribe = async (sku: string) => {
    const result = await purchase(sku)
    if (result) {
      setModalVisible(false)
      await checkQuota()
    }
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.title}>Juez de Yu-Gi-Oh!</Text>
          <Text style={[styles.quota, { color: getQuotaColor() }]}> {questionsRemain} / {questionLimit} </Text>
        </View>
        <Text style={{ color: '#aaa', fontSize: 12 }}>
          Nivel: {user?.subscription_level ?? 'Básico'}
        </Text>


        <View style={{ paddingHorizontal: 20 }}>
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

          <Text style={{ color: '#FFB300', marginTop: 16 }}>{getLimitWarning()}</Text>

          <Button mode="outlined" onPress={() => setModalVisible(true)} style={styles.subscribeButton}>
            Suscribirse para más preguntas
          </Button>
        </View>

        <FlatList
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.answerCard}>
              <Card.Content>
                <Text style={styles.historyQuestion}>🗨️ {item.question}</Text>
                <Text style={styles.answerText}>{item.answer}</Text>
              </Card.Content>
            </Card>
          )}
          onEndReached={loadMoreHistory}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
        />

        <Modal animationType="slide" transparent visible={modalVisible}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Niveles de suscripción</Text>
              <Text style={styles.modalText}>• Básico – 100 preguntas / mes
                {'\n'}• Intermedio – 250 preguntas / mes
                {'\n'}• Premium – 500 preguntas / mes
                {'\n'}• Pro – Ilimitadas</Text>

              {products.map((product) => (
                <Button
                  key={product.productId}
                  mode="contained"
                  style={{ marginTop: 10 }}
                  onPress={() => handleSubscribe(product.productId)}
                >
                  {product.title} – {product.localizedPrice}
                </Button>
              ))}

              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1C' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  quota: { fontWeight: 'bold', fontSize: 14 },
  input: {
    backgroundColor: '#1C1C2E',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: { marginTop: 20, backgroundColor: '#00B0FF' },
  subscribeButton: { marginTop: 10, borderColor: '#FFB300' },
  answerCard: { marginTop: 20, backgroundColor: '#1C1C2E' },
  answerText: { color: 'white', marginTop: 8 },
  historyQuestion: { color: '#FFB300', fontWeight: 'bold' },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#1C1C2E',
    padding: 20,
    borderRadius: 12,
    width: '85%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  modalClose: {
    color: '#FFB300',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
})

import { useState, useEffect } from 'react'
import { View, TextInput, FlatList, StyleSheet, Modal, Pressable, Alert } from 'react-native'
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper'
import { askYugiohBot } from '@/lib/askYugiohBot'
import { canAskQuestion } from '@/lib/questionQuota'
import { getQuestionHistory } from '@/lib/getQuestionHistory'
import { useIAP } from '@/lib/iap/useIAP'
import { SafeAreaView } from 'react-native-safe-area-context'
import AuthGuard from '@/components/AuthGuard'
import useUser from '@/hooks/useUser'
import { supabase } from '@/lib/supabase'
import { COLORS } from '../../../constants/GlobalStyles';


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
  const [currentPlan, setCurrentPlan] = useState('Free')
  const [modalVisible, setModalVisible] = useState(false)
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false)
  const [correctionText, setCorrectionText] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null)

  const { user } = useUser()
  const { products, purchase } = useIAP()

  useEffect(() => {
    if (user?.id) {
      loadInitialHistory()
      checkQuota()
    }
  }, [user])

  const checkQuota = async () => {
    const check = await canAskQuestion(user.id, true)
    setQuestionsUsed(check.used)
    setQuestionLimit(check.limit)
    setQuestionsRemain(check.remaining)
    setCurrentPlan(check.plan)
  }

  const getQuotaColor = () => {
    if (questionLimit === 0) return COLORS.colorFFF
    const ratio = questionsRemain / questionLimit
    if (ratio <= 0.3) return COLORS.colorFFB300
    if (ratio <= 0.6) return COLORS.color00FFAA
    return COLORS.colorFF4444
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

  // Abrir modal de corrección
  const openCorrectionModal = (item: any) => {
    setSelectedAnswer(item)
    setCorrectionText('')
    setCorrectionModalVisible(true)
  }

  // Enviar corrección a Supabase
  const submitCorrection = async () => {
    if (!correctionText.trim()) {
      Alert.alert('Error', 'Por favor escribe la corrección antes de enviar.')
      return
    }

    const { error } = await supabase
      .from('answer_corrections')
      .insert([
        {
          user_id: user.id,
          question_id: selectedAnswer.id,
          original_question: selectedAnswer.question,
          original_answer: selectedAnswer.answer,
          correction: correctionText,
        },
      ])

    if (error) {
      Alert.alert('Error', 'No se pudo enviar la corrección.')
    } else {
      Alert.alert('Gracias', 'Tu corrección ha sido enviada.')
      setCorrectionModalVisible(false)
    }
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.title}>Juez de Yu-Gi-Oh!</Text>
          <Text style={[styles.quota, { color: getQuotaColor() }]}> {questionsRemain} / {questionLimit} </Text>
        </View>
        <View style={styles.headerRowPlan}>
          <Text style={{ color: COLORS.colorAAA, fontSize: 12 }}>Nivel: {currentPlan}</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="¿Cuál es tu duda sobre el juego?"
            placeholderTextColor={COLORS.colorAAA}
            style={styles.input}
            multiline
          />
          <Button mode="contained" onPress={handleAsk} disabled={loading} style={styles.button}>
            {loading ? 'Consultando...' : 'Preguntar'}
          </Button>

          <Text style={{ color: COLORS.colorFFB300, marginTop: 16 }}>{getLimitWarning()}</Text>

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
              <Pressable onPress={() => openCorrectionModal(item)}>
                <Text style={styles.correctionLabel}>✏️ Corregir respuesta</Text>
              </Pressable>
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

        {/* Modal de suscripción */}
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

        {/* Modal de corrección */}
        <Modal animationType="slide" transparent visible={correctionModalVisible}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Corregir respuesta</Text>
              <Text style={styles.modalText}>
                Si crees que esta respuesta es incorrecta, por favor escribe aquí tu respuesta correcta:
              </Text>
              <TextInput
                value={correctionText}
                onChangeText={setCorrectionText}
                placeholder="Escribe tu corrección..."
                placeholderTextColor={COLORS.colorAAA}
                style={styles.input}
                multiline
              />
              <Button mode="contained" style={{ marginTop: 10 }} onPress={submitCorrection}>
                Enviar corrección
              </Button>
              <Pressable onPress={() => setCorrectionModalVisible(false)}>
                <Text style={styles.modalClose}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.color0A0F1C },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRowPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: { color: COLORS.colorFFF, fontWeight: 'bold', fontSize: 22 },
  quota: { fontWeight: 'bold', fontSize: 14 },
  input: {
    backgroundColor: COLORS.color1C1C2E,
    color: COLORS.white,
    padding: 12,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: { marginTop: 20, backgroundColor: COLORS.color00B0FF },
  subscribeButton: { marginTop: 10, borderColor: COLORS.colorFFB300 },
  answerCard: { marginTop: 20, backgroundColor: COLORS.color1C1C2E },
  answerText: { color: COLORS.white, marginTop: 8 },
  historyQuestion: { color: COLORS.colorFFB300, fontWeight: 'bold' },
  correctionLabel: { color: COLORS.color00B0FF, padding: 8, fontSize: 12, textDecorationLine: 'underline' },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: COLORS.color1C1C2E,
    padding: 20,
    borderRadius: 12,
    width: '85%',
    alignSelf: 'center',
  },
  modalTitle: { color: COLORS.colorFFF, fontSize: 18, fontWeight: 'bold' },
  modalText: { color: COLORS.colorCCC, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  modalClose: {
    color: COLORS.colorFFB300,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
})

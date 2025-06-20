
import { supabase } from '@/lib/supabase'

export async function getQuestionHistory(userId: string, page: number, pageSize = 10) {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('question_logs')
    .select('id, question, answer, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('❌ Error al cargar historial:', error)
    return []
  }

  return data
}

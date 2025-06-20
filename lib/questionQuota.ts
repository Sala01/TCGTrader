// lib/questionQuota.ts
import { supabase } from './supabase'

export async function canAskQuestion(userId: string): Promise<{
  allowed: boolean
  message: string
}> {
  const { data, error } = await supabase
    .from('user_question_quota')
    .select('questions_left')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { allowed: false, message: 'Error al validar el límite de preguntas.' }
  }

  if (!data) {
    // Si no existe el registro, lo creamos con 10 preguntas
    const { error: insertError } = await supabase
      .from('user_question_quota')
      .insert({ user_id: userId, questions_left: 9 })

    if (insertError) {
      return { allowed: false, message: 'Error al inicializar el contador de preguntas.' }
    }

    return { allowed: true, message: 'Pregunta permitida. Contador inicializado.' }
  }

  if (data.questions_left <= 0) {
    return { allowed: false, message: 'Has alcanzado tu límite de preguntas por mes.' }
  }

  // Restamos una pregunta
  const { error: updateError } = await supabase
    .from('user_question_quota')
    .update({ questions_left: data.questions_left - 1 })
    .eq('user_id', userId)

  if (updateError) {
    return { allowed: false, message: 'No se pudo actualizar el contador.' }
  }

  return { allowed: true, message: 'Pregunta registrada correctamente.' }
}

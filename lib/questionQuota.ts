import { supabase } from './supabase'

const MAX_PER_MONTH = 10

export async function canAskQuestion(userId: string, check: boolean = false): Promise<{
  allowed: boolean
  message: string
  used: number
  remaining: number
  plan: string
  limit: number
}> {
  const { data, error } = await supabase
    .from('user_question_quota')
    .select('questions_left, current_plan')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return {
      allowed: false,
      message: 'Error al validar el límite de preguntas.',
      used: MAX_PER_MONTH,
      remaining: 0,
      limit: MAX_PER_MONTH,
      plan: 'Free',
    }
  }

  if (!data) {
    // Si no existe el registro, lo creamos con el máximo de preguntas
    const { error: insertError } = await supabase
      .from('user_question_quota')
      .insert({ user_id: userId, questions_left: MAX_PER_MONTH })

    if (insertError) {
      return {
        allowed: false,
        message: 'Error al inicializar el contador de preguntas.',
        used: MAX_PER_MONTH,
        remaining: 0,
        limit: MAX_PER_MONTH,
        plan: 'Free'
      }
    }

    return {
      allowed: true,
      message: 'Pregunta permitida. Contador inicializado.',
      used: 0,
      remaining: MAX_PER_MONTH,
      limit: MAX_PER_MONTH,
      plan: 'Free'
    }
  }

  if (data.questions_left <= 0) {
    return {
      allowed: false,
      message: 'Has alcanzado tu límite de preguntas por mes.',
      used: MAX_PER_MONTH,
      remaining: 0,
      limit: MAX_PER_MONTH,
      plan: data.current_plan
    }
  }

  let remaining = data.questions_left
  let used = MAX_PER_MONTH - remaining

  if(!check) {

    remaining = data.questions_left - 1
    used = MAX_PER_MONTH - remaining

    const { error: updateError } = await supabase
      .from('user_question_quota')
      .update({ questions_left: remaining })
      .eq('user_id', userId)

    if (updateError) {
      return {
        allowed: false,
        message: 'No se pudo actualizar el contador.',
        used,
        remaining,
        limit: MAX_PER_MONTH,
        plan: data.current_plan
      }
    }
  }

  return {
    allowed: true,
    message: 'Pregunta registrada correctamente.',
    used,
    remaining,
    limit: MAX_PER_MONTH,
    plan: data.current_plan
  }
}
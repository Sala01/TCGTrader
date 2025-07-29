import { supabase } from '@/lib/supabase';

const BOT_URL = 'https://api.onlycarry.com/ask'; // Ajusta según tu FastAPI

async function getOrCreateThreadId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_threads')
    .select('thread_id')
    .eq('user_id', userId)
    .single();

  if (data?.thread_id) return data.thread_id;

  // En este caso no usamos OpenAI threads, generamos un UUID local si quieres
  const newThreadId = crypto.randomUUID();

  await supabase.from('user_threads').insert({
    user_id: userId,
    thread_id: newThreadId,
  });

  return newThreadId;
}

export async function askYugiohBot(question: string, userId: string): Promise<string> {
  try {
    const threadId = await getOrCreateThreadId(userId);

    const res = await fetch(BOT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      console.error('❌ Error del bot:', res.status, await res.text());
      return 'No se obtuvo respuesta del Juez Yugioh.';
    }

    const data = await res.json();
    const answer = data.answer || 'El Juez Yugioh no proporcionó una respuesta.';

    await supabase.from('question_logs').insert({
      user_id: userId,
      question,
      answer,
      thread_id: threadId,
    });

    return answer;
  } catch (err) {
    console.error('❌ Error con el bot:', err);
    return 'Hubo un error al consultar el Juez Yugioh.';
  }
}

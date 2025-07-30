import { supabase } from '@/lib/supabase';

const BOT_URL = 'https://api.onlycarry.com/ask'; // Ajusta según tu FastAPI

export async function askYugiohBot(question: string, userId: string): Promise<string> {
  try {
    const threadId = 0;

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

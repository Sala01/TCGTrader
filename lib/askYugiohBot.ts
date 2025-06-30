
import { supabase } from '@/lib/supabase';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY!;
const ASSISTANT_ID = process.env.EXPO_PUBLIC_ASSISTANT_ID!;
const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  'OpenAI-Beta': 'assistants=v2',
};

async function getOrCreateThreadId(userId: string): Promise<string> {
  /*const { data, error } = await supabase
    .from('user_threads')
    .select('thread_id')
    .eq('user_id', userId)
    .single();

  if (data?.thread_id) return data.thread_id;*/

  const threadRes = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: HEADERS,
  });

  const threadData = await threadRes.json();
  const newThreadId = threadData.id;

  await supabase.from('user_threads').insert({
    user_id: userId,
    thread_id: newThreadId,
  });

  return newThreadId;
}

export async function askYugiohBot(question: string, userId: string): Promise<string> {
  try {
    const threadId = await getOrCreateThreadId(userId);

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        role: 'user',
        content: question,
      }),
    });

    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
    });

    const runData = await runRes.json();
    const runId = runData.id;

    let status = 'queued';
    while (status === 'queued' || status === 'in_progress') {
      await new Promise((res) => setTimeout(res, 1500));
      const statusRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        { headers: HEADERS }
      );
      const statusData = await statusRes.json();
      status = statusData.status;
    }

    const messagesRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { headers: HEADERS }
    );
    const messagesData = await messagesRes.json();

    if (!messagesData.data || !Array.isArray(messagesData.data)) {
      console.error('❌ No se recibieron mensajes del assistant:', messagesData);
      return 'No se obtuvo respuesta del Juez Yugioh.';
    }

    const lastMessage = messagesData.data
      .reverse()
      .find((msg: any) => msg.role === 'assistant');

    if (!lastMessage || !lastMessage.content?.[0]?.text?.value) {
      return 'El Juez Yugioh no proporcionó una respuesta.';
    }

    let text = lastMessage.content[0].text.value;
    const annotations = lastMessage.content[0].text.annotations || [];

    for (const ann of annotations) {
      text = text.replace(ann.text, ann.file_citation?.quote || '');
    }

    const cleanedAnswer = text.trim();

    await supabase.from('question_logs').insert({
      user_id: userId,
      question,
      answer: cleanedAnswer,
      thread_id: threadId,
    });

    return cleanedAnswer;
  } catch (err) {
    console.error('❌ Error con Assistant API:', err);
    return 'Hubo un error al consultar el Juez Yugioh.';
  }
}

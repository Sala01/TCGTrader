const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY!;
const ASSISTANT_ID = process.env.EXPO_PUBLIC_ASSISTANT_ID!;

export async function askYugiohBot(question: string): Promise<string> {
  try {
    // 1. Crear un thread vacío
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    const threadData = await threadRes.json();
    const threadId = threadData.id;

    // 2. Agregar el mensaje del usuario al thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        role: 'user',
        content: question,
      }),
    });

    // 3. Ejecutar el Assistant
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
    });

    const runData = await runRes.json();
    const runId = runData.id;

    // 4. Esperar hasta que esté completo
    let status = 'queued';
    while (status === 'queued' || status === 'in_progress') {
      await new Promise((res) => setTimeout(res, 1500));
      const statusRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );
      const statusData = await statusRes.json();
      status = statusData.status;
    }

    // 5. Obtener la respuesta
    const messagesRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    const messagesData = await messagesRes.json();
    const lastMessage = messagesData.data
      .reverse()
      .find((msg: any) => msg.role === 'assistant');

    return lastMessage?.content?.[0]?.text?.value ?? 'No se obtuvo respuesta.';
  } catch (err) {
    console.error('❌ Error con Assistant API:', err);
    return 'Hubo un error al consultar el Juez Yugioh.';
  }
}


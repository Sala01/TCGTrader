// lib/sendPush.ts
export async function sendPushNotification(toToken: string, title: string, body: string) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: toToken,
      sound: 'default',
      title,
      body,
    }),
  })
}

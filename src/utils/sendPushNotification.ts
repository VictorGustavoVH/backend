// utils/sendPushNotification.ts
import axios from 'axios';

export async function sendPushNotification(
  expoPushToken: string,
  message: { title: string; body: string; data?: any }
) {
  const expoEndpoint = 'https://exp.host/--/api/v2/push/send';
  const payload = {
    to: expoPushToken,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: message.data,
  };

  try {
    await axios.post(expoEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Notificación enviada a', expoPushToken);
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}

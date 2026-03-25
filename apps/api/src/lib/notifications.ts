import { prisma } from './prisma';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function createNotification({ userId, type, title, body, data }: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data: data || undefined },
  });

  // Send push notification if user has a push token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  if (user?.pushToken) {
    try {
      await sendExpoPush(user.pushToken, title, body, data);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { pushSent: true },
      });
    } catch (err) {
      console.error('Push notification failed:', err);
    }
  }

  return notification;
}

async function sendExpoPush(pushToken: string, title: string, body: string, data?: Record<string, any>) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed: ${response.status}`);
  }

  return response.json();
}

// Helper to notify on booking events
export async function notifyBookingEvent(
  booking: { id: string; clientId: string; providerId: string; ref: string },
  providerUserId: string,
  providerName: string,
  clientName: string,
  serviceName: string,
  event: string,
) {
  const bookingData = { bookingId: booking.id };

  switch (event) {
    case 'REQUESTED':
      // Notify provider
      await createNotification({
        userId: providerUserId,
        type: 'BOOKING_REQUESTED',
        title: 'Nouvelle demande',
        body: `${clientName} a réservé ${serviceName}`,
        data: bookingData,
      });
      break;

    case 'CONFIRMED':
      // Notify client
      await createNotification({
        userId: booking.clientId,
        type: 'BOOKING_CONFIRMED',
        title: 'Réservation confirmée',
        body: `${providerName} a confirmé votre RDV pour ${serviceName}`,
        data: bookingData,
      });
      break;

    case 'IN_PROGRESS':
      // Notify client
      await createNotification({
        userId: booking.clientId,
        type: 'BOOKING_IN_PROGRESS',
        title: 'Service en cours',
        body: `${providerName} a démarré ${serviceName}`,
        data: bookingData,
      });
      break;

    case 'COMPLETED':
      // Notify client
      await createNotification({
        userId: booking.clientId,
        type: 'BOOKING_COMPLETED',
        title: 'Service terminé',
        body: `${serviceName} avec ${providerName} est terminé. Laissez un avis !`,
        data: bookingData,
      });
      break;

    case 'CANCELLED':
      // Notify both parties
      await createNotification({
        userId: booking.clientId,
        type: 'BOOKING_CANCELLED',
        title: 'Réservation annulée',
        body: `Votre réservation pour ${serviceName} a été annulée`,
        data: bookingData,
      });
      await createNotification({
        userId: providerUserId,
        type: 'BOOKING_CANCELLED',
        title: 'Réservation annulée',
        body: `La réservation de ${clientName} pour ${serviceName} a été annulée`,
        data: bookingData,
      });
      break;
  }
}

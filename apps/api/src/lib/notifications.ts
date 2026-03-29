import { prisma } from './prisma';
import { BookingStatus } from '@prisma/client';

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

// Send booking reminders for appointments happening tomorrow
export async function sendBookingReminders(): Promise<number> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find bookings happening tomorrow that are confirmed or deposit paid
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.DEPOSIT_PAID] },
      date: { gte: tomorrow, lt: tomorrowEnd },
    },
    include: {
      client: { select: { id: true, name: true } },
      provider: {
        select: {
          displayName: true,
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { name: true } },
    },
  });

  let remindersSent = 0;

  for (const booking of bookings) {
    // Check if a reminder was already sent for this booking
    const existingReminder = await prisma.notification.findFirst({
      where: {
        type: 'BOOKING_REMINDER',
        data: { path: ['bookingId'], equals: booking.id },
      },
    });

    if (existingReminder) continue;

    const serviceName = booking.service.name;
    const providerName = booking.provider.displayName;
    const clientName = booking.client.name;
    const startTime = booking.startTime;

    // Notify client
    await createNotification({
      userId: booking.clientId,
      type: 'BOOKING_REMINDER',
      title: 'Rappel — RDV demain !',
      body: `Votre service "${serviceName}" avec ${providerName} est prévu demain à ${startTime}.`,
      data: { bookingId: booking.id },
    });

    // Notify provider
    await createNotification({
      userId: booking.provider.user.id,
      type: 'BOOKING_REMINDER',
      title: 'Rappel — Client demain',
      body: `${clientName} a réservé "${serviceName}" demain à ${startTime}.`,
      data: { bookingId: booking.id },
    });

    remindersSent++;
  }

  return remindersSent;
}

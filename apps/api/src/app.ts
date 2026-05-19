import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/error';
import { sendBookingReminders } from './lib/notifications';

import authRoutes from './routes/auth.routes';
import providerRoutes from './routes/provider.routes';
import searchRoutes from './routes/search.routes';
import bookingRoutes from './routes/booking.routes';
import categoryRoutes from './routes/category.routes';
import reviewRoutes from './routes/review.routes';
import favoriteRoutes from './routes/favorite.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import requestRoutes from './routes/request.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import kycRoutes from './routes/kyc.routes';
import walletRoutes from './routes/wallet.routes';
import aiRoutes from './routes/ai.routes';
import feedRoutes from './routes/feed.routes';

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = [
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:8081']),
  'https://tobongi.github.io', // GitHub Pages test deployment
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '55mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'karysm-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/feed', feedRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Check for booking reminders every hour
setInterval(async () => {
  try {
    const count = await sendBookingReminders();
    if (count > 0) console.log(`[Reminders] Sent ${count} booking reminders`);
  } catch (err) {
    console.error('[Reminders] Error:', err);
  }
}, 60 * 60 * 1000);

export { app };

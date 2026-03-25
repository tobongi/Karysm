import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/error';

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

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://tokoss.com', 'https://admin.tokoss.com']
    : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:8081'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '55mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tokoss-api', timestamp: new Date().toISOString() });
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

// Error handler
app.use(errorHandler);

export { app };

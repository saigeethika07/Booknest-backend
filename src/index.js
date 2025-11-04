import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from './lib/db.js';
import authRouter from './routes/auth.routes.js';
import booksRouter from './routes/books.routes.js';
import categoriesRouter from './routes/categories.routes.js';
import cartRouter from './routes/cart.routes.js';
import paymentRouter from './routes/payment.routes.js';

dotenv.config();

const app = express();

// ✅ Allow both local and deployed frontend origins
app.use(cors({
  origin: [
    'http://localhost:5173', // local development
    'https://booknest-frontend.vercel.app', // deployed frontend URL (update if different)
  ],
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// ✅ Root route for Render health check
app.get('/', (req, res) => {
  res.send('BookNest backend is running successfully 🚀');
});

// ✅ Simple health check route
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

// ✅ API routes
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/payment', paymentRouter);

// ✅ Server startup
const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

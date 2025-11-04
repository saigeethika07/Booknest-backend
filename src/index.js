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
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/payment', paymentRouter);

const PORT = process.env.PORT || 5000;

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});



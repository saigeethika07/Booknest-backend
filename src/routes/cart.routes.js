import express from 'express';
import Cart from '../models/Cart.model.js';
import Book from '../models/Book.model.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// For demo, allow a guest user via x-user-id header or default seeded user
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

function toClientCart(cart, booksById) {
  const items = cart.items.map((it) => {
    const book = booksById.get(String(it.bookId));
    return {
      bookId: String(it.bookId),
      quantity: it.quantity,
      book: book ? {
        title: book.title,
        author: book.author,
        price: book.price,
        image: book.image
      } : null
    };
  });
  const subtotal = items.reduce((sum, it) => sum + ((it.book?.price || 0) * it.quantity), 0);
  return { items, subtotal };
}

// 📦 Get current user's cart
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || '000000000000000000000000';
    const cart = await getOrCreateCart(userId);
    const bookIds = cart.items.map((i) => i.bookId);
    const books = await Book.find({ _id: { $in: bookIds } });
    const booksById = new Map(books.map((b) => [String(b._id), b]));
    const { items, subtotal } = toClientCart(cart, booksById);
    return res.json({ success: true, cart: items, total: subtotal });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch cart', error: e.message });
  }
});

// 🛒 Add or update cart item
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId || '000000000000000000000000';
    const { bookId, quantity } = req.body;
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const cart = await getOrCreateCart(userId);
    const index = cart.items.findIndex((it) => String(it.bookId) === String(bookId));
    if (index >= 0) {
      cart.items[index].quantity = quantity;
      if (cart.items[index].quantity <= 0) {
        cart.items.splice(index, 1);
      }
    } else if (quantity > 0) {
      cart.items.push({ bookId, quantity });
    }
    await cart.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update cart', error: e.message });
  }
});

// ❌ Remove specific book from cart
router.delete('/:bookId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || '000000000000000000000000';
    const { bookId } = req.params;
    const cart = await getOrCreateCart(userId);
    cart.items = cart.items.filter((it) => String(it.bookId) !== String(bookId));
    await cart.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to remove item', error: e.message });
  }
});

// 🧹 Clear all items from cart (after order confirm)
router.delete('/clear/all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || '000000000000000000000000';
    const cart = await getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
    return res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to clear cart', error: e.message });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await Cart.deleteMany({});
    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing cart' });
  }
});

export default router;

import express from 'express';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import Book from '../models/Book.model.js';

const router = express.Router();

/**
 * 🧾 GET all orders for a user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || '000000000000000000000000';

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    const response = orders.map((o) => ({
      id: o._id,
      userId: o.userId,
      total: o.total,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      cartItems: o.cartItems.map((it) => ({
        title: it.title,
        quantity: it.quantity,
        price: it.price
      }))
    }));

    return res.json({ success: true, orders: response });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders', error: e.message });
  }
});

/**
 * 🛒 POST create order (after checkout)
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId || '000000000000000000000000';
    const { paymentMethod = 'COD' } = req.body;

    // Fetch user’s cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Fetch book details for pricing
    const bookIds = cart.items.map((i) => i.bookId);
    const books = await Book.find({ _id: { $in: bookIds } });

    const items = cart.items.map((it) => {
      const book = books.find((b) => String(b._id) === String(it.bookId));
      return {
        bookId: it.bookId,
        title: book?.title || '',
        quantity: it.quantity,
        price: book?.price || 0
      };
    });

    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    // Create order
    const order = await Order.create({
      userId,
      cartItems: items,
      total,
      paymentMethod
    });

    // Clear cart after placing order
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: order._id,
        total: order.total,
        createdAt: order.createdAt,
        cartItems: order.cartItems
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to create order', error: e.message });
  }
});

export default router;

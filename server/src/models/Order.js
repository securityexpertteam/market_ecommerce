const mongoose = require('mongoose');
const Payment = require('./Payment');
const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    imageURL: String,
    prizeEntry: { type: Boolean, default: false },
  }],
  subtotal: { type: Number, required: true },
  prizeEntryTotal: { type: Number, min: 0, default: 0 },
  platformFeeRate: { type: Number, min: 0, max: 100, default: 3 },
  platformFeeAmount: { type: Number, min: 0, default: 0 },
  platformDiscountRate: { type: Number, min: 0, max: 100, default: 0 },
  platformDiscountAmount: { type: Number, min: 0, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'delivered', 'cancelled'], default: 'pending' },
  delivery: {
    address: String,
    contact: String,
    community: String,
    nodalPoint: String,
    eta: String,
  },
}, { timestamps: true });

orderSchema.post('save', async (order) => {
  try {
    await Payment.create({
      order: order._id,
      buyer: order.buyer,
      amount: order.total,
      status: 'captured',
      provider: 'dummy',
      transactionId: `dummy_${order._id}`,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
});

module.exports = mongoose.model('Order', orderSchema);

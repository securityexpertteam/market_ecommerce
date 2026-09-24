const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, min: 1, max: 20, required: true },
    prizeEntry: { type: Boolean, default: false },
  }],
  platformDiscountRate: { type: Number, min: 0, max: 10, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);

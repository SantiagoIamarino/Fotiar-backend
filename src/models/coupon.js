const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  discountPercentage: { type: Number, required: true },
  code: { type: String, required: true },
  title: { type: String, required: true }
});

module.exports = mongoose.model('Coupon', couponSchema);
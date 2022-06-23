const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const comboDiscountSchema = new Schema({
  percentage: { type: Number, required: true },
  imagesAmount: { type: Number, required: true }
});

module.exports = mongoose.model('ComboDiscount', comboDiscountSchema);
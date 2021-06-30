const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    // orderId: { type: String, required: true },
    images: { type: Array, required: true },
    totalAmount: { type: Number, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    establishment: { type: String, default: 'web' }, // Cerro/web
    status: { type: String, default: 'completed' }, // completed/pending/cancelled
    orderDate: { type: Date, default: new Date() },
    paymentDate: { type: Date, default: null },
    paymentMethod: { type: String, default: 'mercadopago' }, // mercadopago/cashier
    observation: { type: String },
});

module.exports = mongoose.model('Order', orderSchema);
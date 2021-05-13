const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String },
    username: { type: String, required: true },
    role : { type: String, default: 'CLIENT_ROLE' },
    email: { type: String, required: true },
    password: { type: String, required: true },
    favorites: { type: Array, default: [] },
    purchases: { type: Array, default: [] },
    purchasesNetAmount: { type: Number, default: 0 },
    observation: { type: String },
    createdAt: { type: Date, default: new Date() },
})

module.exports = mongoose.model('User', userSchema);
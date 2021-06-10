const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
        {
            imageId: { type: Schema.Types.ObjectId, ref: 'Image'},
            quantity: { type: Number }
        }
    ]
});

module.exports = mongoose.model('Cart', cartSchema);
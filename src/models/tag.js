const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imagesLinked: { type: Array, default: [] },
    value: { type: String, required: true } 
});

module.exports = mongoose.model('Tag', tagSchema);
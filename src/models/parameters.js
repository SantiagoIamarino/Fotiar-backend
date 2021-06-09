const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ParametersSchema = new Schema({
    unityPrice: { type: Number, required: true }
});

module.exports = mongoose.model('Parameters', ParametersSchema);
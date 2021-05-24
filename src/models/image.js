const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    creationDate: { type: Date, required: true },
    uploadDate: { type: String, default: new Date() },
    status: { type: String, default: 'visible' },
    fileName: { type: String, required: true },
    copyFileName: { type: String, required: true },
    totalSells: { type: String, default: 0 },
    tags: { type: Array, default: [] },
    photographerId: { type: String, required: true },
    exifData: { type: Object }
});

module.exports = mongoose.model('Image', imageSchema);
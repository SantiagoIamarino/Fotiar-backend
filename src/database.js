const mongoose = require('mongoose');

let url;

url = process.env.MONGO_URL;

mongoose.connection.openUri(url, (err, res) => {
    if (err) throw err;

    console.log('Database running fine!', process.env.NODE_ENV);
})

module.exports = mongoose;
const mongoose = require('mongoose');

let url;

// If is dev enviroment use .env file
if(process.env.NODE_ENV === 'dev') {

    const dotenv = require('dotenv');
    dotenv.config();

    const {
        MONGO_USERNAME,
        MONGO_PASSWORD,
        MONGO_HOSTNAME,
        MONGO_PORT,
        MONGO_DB
    } = process.env;
    
    url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

} else {

    url = process.env.MONGO_URL;

}

console.log(url)

mongoose.connection.openUri(url, (err, res) => {
    if (err) throw err;

    console.log('Database running fine!', process.env.NODE_ENV);
})

module.exports = mongoose;
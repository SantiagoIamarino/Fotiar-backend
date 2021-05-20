//Requires
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// const path = require('path');

const app = express();

// CORS, ONLY FOR DEV

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    next();
});

//Body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));


const http = require('http').createServer( app);

// Import routes
const userRoutes =  require('./routes/users');
const authRoutes =  require('./routes/auth');
const profileRoutes =  require('./routes/profile');
const filesRoutes =  require('./routes/files');

// DB connection
// mongoose.connection.openUri('mongodb://localhost:27017/FOTIARDB', (err, res) => {
mongoose.connection.openUri('mongodb://Server:Fotiar_Sistemas12@127.0.0.1:27017/FotiarDB', (err, res) => {
    if (err) throw err;

    console.log('Database running fine!');
})


// Routes 
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/files', filesRoutes);


// Listen port 3000
http.listen(3000, () => {
    console.log('Express running on port 3000');
})

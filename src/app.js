//Requires
const express = require('express');
const bodyParser = require('body-parser');
// const path = require('path');

const app = express();

const dotenv = require('dotenv')
dotenv.config()

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


// Import routes
const userRoutes =  require('./routes/users');
const authRoutes =  require('./routes/auth');
const profileRoutes =  require('./routes/profile');
const filesRoutes =  require('./routes/files');
const imagesRoutes =  require('./routes/images');
const tagsRoutes =  require('./routes/tags');
const parametersRoutes =  require('./routes/parameters');
const cartRoutes =  require('./routes/cart');
const checkoutRoutes =  require('./routes/checkout');
const cashierRoutes =  require('./routes/cashier');
const ordersRoutes =  require('./routes/orders');
const notificationsRoutes = require('./routes/notifications')
const combosRoutes = require('./routes/combos')
const couponsRoutes = require('./routes/coupons')


// DB connection
if(!process.env.TESTING_ENV) {
    var mongoose = require('./database')
}

// Routes 
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/files', filesRoutes);
app.use('/images', imagesRoutes);
app.use('/tags', tagsRoutes);
app.use('/parameters', parametersRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/cashier', cashierRoutes);
app.use('/orders', ordersRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/discounts/combos', combosRoutes);
app.use('/discounts/coupons', couponsRoutes);


// Listen port 3000
const server = app.listen(3000, () => {
    console.log('Express running on port 3000');
})

module.exports = { app, server }

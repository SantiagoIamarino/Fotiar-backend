const express = require('express');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

const Order = require('../models/order');
const Cart = require('../models/cart');

const { getUserById } = require('../functions/usersAux')
const { generateMPOrder } = require('../functions/mercadopago')

const app = express();

function updateUserCart(user) {
    return new Promise((resolve, reject) => {
        Cart.findOne({userId: user._id}, (err, cartDB) => {
            if(err || cartDB) {
                resolve('Cart not updated');
            }

            cartDB.products = [];

            cartDB.update(cartDB, (errUpdt, cartUpdated) => {
                if(errUpdt) {
                    resolve('Cart not updated');
                }

                resolve(cartUpdated);
            })
        })
    })
}

function getPhotographers(images) {
    const photographers = [];
    // It will return the photographers that had uploaded these images
    images.forEach(image => {
        const photographerId = image.imageId.photographerId;

        if(photographers.indexOf(photographerId) < 0) {
            photographers.push(photographerId);
        }
    });

    return photographers;
}

function createOrder(data, user, orderId = null) {
    return new Promise(async (resolve, reject) => {
        let images = data.products;
        
        const orderData = {
            images,
            totalAmount: data.total,
            userId: user._id,
            userEmail: data.email,
            status: 'pending',
            paymentMethod: data.paymentOption,
            photographers: getPhotographers(data.products)
        }

        const order = new Order(orderData);
    
        order.save(async (err, orderSaved) => {
            if(err) {
                reject(err);
                return;
            } 

            data.products.forEach(product => {
                const imageId = product.imageId._id;
                if(user.purchases.indexOf(imageId) < 0) {
                    user.purchases.push(imageId);
                }
            });

            try {

                await updateUserCart(user);

                resolve(orderSaved)

            } catch (error) {
                reject(error)
            }
        })
    })
}

app.post('/mercadopago/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], async (req, res) => {
    
    const order = await createOrder(req.body, req.user)

    generateMPOrder(req.body, order.orderId).then((resp) => {

        const qrData = resp.data.qr_data;
        
        return res.status(201).json({
            ok: true,
            qrData
        })

    })
    .catch((error) => {

        return res.status(400).json({
            ok: false,
            error
        })
    })
    
})

app.post('/cashier/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], async (req, res) => {
    const userToUpdate = await getUserById(req.user._id);

    createOrder(req.body, userToUpdate).then((orderRes) => {
        return res.status(201).json({
            ok: true,
            order: orderRes,
        })
    })
    .catch((error) => {
        return res.status(400).json({
            ok: false,
            error
        })
    })
})

module.exports = app;
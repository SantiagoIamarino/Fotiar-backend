const express = require('express');
const jwt = require('jsonwebtoken');
const jwtKey = require('../config/vars').jwtKey;

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

const Order = require('../models/order');
const User = require('../models/user');
const Cart = require('../models/cart');
const Image = require('../models/image');

var mercadopago = require('mercadopago');
mercadopago.configurations.setAccessToken("TEST-2250573947337888-111301-a3d1541cf8e11603c5f12f1998b40338-222073650");

const app = express();

function getUser(userId) {
    return new Promise((resolve, reject) => {
        User.findById(userId, (err, userDB) => {
            if(err || !userDB) {
                reject()
            }
    
            resolve(userDB);
        })
    })
}

function updateUserPurchases(user) {
    return new Promise((resolve, reject) => {
        User.findById(user._id, (errUpdt, userDB) => {
            if(errUpdt) {
                reject(errUpdt);
            }

            userDB.purchases = user.purchases;

            userDB.update(userDB, (errUpdt, userUpdated) => {
                resolve(userUpdated.purchases);
            })
        })
    })
}

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

function getTokenExpiration() {
    const daysToExpire = 3;
    const expiration = 1000 * 60 * 60 * 24 * daysToExpire; // three days in ms

    const tokenExpiration = new Date().getTime() + expiration;

    return tokenExpiration;
}

function createUserToken(user) {
    return new Promise((resolve, reject) => {
        const payload = {
            check: true,
            user
        }
    
        const token = jwt.sign(payload, jwtKey, {
            expiresIn: "3d"
        });

        resolve( {
            token,
            tokenExp: getTokenExpiration()
        })
    })
}

async function getImages(images) {
    return new Promise((resolve, reject) => {
        const imagesId = [];

        images.forEach(image => {
            if(imagesId.indexOf(image.imageId._id) < 0) {
                imagesId.push(image.imageId._id);
            }
        });
    
        Image.find({ _id: { $in: imagesId } }, (err, imagesFound) => {
            if(err) {
                reject(error);
            }
    
            resolve(imagesFound);
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

        if(data.paymentOption == 'mercadopago') {
            images = await getImages(data.products);
        }
        
        const orderData = {
            images,
            totalAmount: data.total,
            userId: user._id,
            userEmail: data.email,
            orderId: (orderId) ? orderId : new Date().getTime(),
            status: (data.paymentOption == 'mercadopago') ? 'completed' : 'pending',
            paymentMethod: data.paymentOption,
            photographers: getPhotographers(data.products)
        }

        if(data.paymentOption == 'mercadopago') {
            const now = new Date();
            orderData.paymentDate = now;
            orderData.orderDate = now;
        }

        const order = new Order(orderData);
    
        order.save(async (err, orderSaved) => {
            if(err) {
                reject(err);
            } else {
                data.products.forEach(product => {
                    const imageId = product.imageId._id;
                    if(user.purchases.indexOf(imageId) < 0) {
                        user.purchases.push(imageId);
                    }
                });

                try {
                    await updateUserCart(user);
                    
                    if(data.paymentOption == 'mercadoPago' && orderId) {
                        await updateUserPurchases(user);
                        const tokenData = await createUserToken(user);

                        resolve({
                            order: orderSaved,
                            userPurchases: user.purchases,
                            token: tokenData.token,
                            tokenExp: tokenData.tokenExp
                        })
                    } else {
                        resolve({
                            order: orderSaved
                        })
                    }
                    

                } catch (error) {
                    reject(error)
                }
            }
        })
    })
}

app.post('/mercadopago/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], (req, res) => {
    const payment_data = {
        transaction_amount: Number(req.body.total),
        token: req.body.mercadopago.token,
        description: "Compra de imagenes Fotiar",
        installments: Number(req.body.mercadopago.installementChoosed),
        payment_method_id: req.body.mercadopago.paymentMethod,
        payer: {
            email: req.body.email,
            identification: {
                type: req.body.docType,
                number: req.body.docNumber
            }
        }
    };

    mercadopago.payment.save(payment_data)
        .then(async (response) => {
            if(response.body.status == 'approved') {
                const userToUpdate = await getUser(req.user._id);
                createOrder(req.body, userToUpdate, response.id).then((orderRes) => {
                    return res.status(201).json({
                        ok: true,
                        order: orderRes.order,
                        userPurchases: orderRes.userPurchases,
                        token: orderRes.token,
                        tokenExp: orderRes.tokenExp
                    })
                })
                .catch((error) => {
                    return res.status(400).json({
                        ok: false,
                        error
                    })
                })
            } else {
                return res.status(response.status).json({
                    response,
                    status: response.body.status,
                    status_detail: response.body.status_detail,
                    id: response.body.id
                });
            }
            
        })
        .catch((error) => {
            return res.status(400).json({
                ok: false,
                error
            });
        });
})

app.post('/cashier/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], async (req, res) => {
    const userToUpdate = await getUser(req.user._id);

    createOrder(req.body, userToUpdate).then((orderRes) => {
        return res.status(201).json({
            ok: true,
            order: orderRes.order,
            userPurchases: orderRes.userPurchases,
            token: orderRes.token,
            tokenExp: orderRes.tokenExp
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
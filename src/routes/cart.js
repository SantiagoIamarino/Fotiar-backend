const express = require('express');
const app = express();

const Cart = require('../models/cart');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

function createCart(userId, products = []) {
    return new Promise((resolve, reject) => {
        const cart = new Cart({
            userId,
            products
        })

        cart.save((err, cartSaved) => {
            if(err) {
                reject(err)
            } else {
                resolve(cartSaved)
            }
        } )
    })
    


}

app.get('/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], (req, res) => {
    const userId = req.params.userId;

    Cart.findOne({userId})
        .populate('products.imageId', 'copyFileName _id exifData photographerId') 
        .exec( async (err, cartDB) => {
            if(err) {
                return res.status(500).json({
                    ok: false,
                    error: err
                })
            }

            if(!cartDB) {
                cartDB = await createCart(userId);
            }

            return res.status(200).json({
                ok: true,
                cart: cartDB
            })
        })
})

app.post('/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], (req, res) => {
    const userId = req.params.userId;
    const imageId = req.body.imageId;

    Cart.findOne({userId}, async (err, cartDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!cartDB) {
            cartDB = await createCart(userId);
        }

        const existProduct = cartDB.products.findIndex((product => product.imageId == imageId));

        if(existProduct >= 0) {
            // cartDB.products[existProduct].quantity++;
            return res.status(400).json({
                ok: true
            })
        }
        
        cartDB.products.push({
            imageId,
            quantity: 1
        })
        
        cartDB.update(cartDB, (errUpdt, cartUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Producto añadido al carrito correctamente'
            })
        })
    })
})

app.delete('/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], (req, res) => {
    const userId = req.params.userId;
    const imageId = req.query.imageId;

    Cart.findOne({userId}, async (err, cartDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!cartDB) {
            return res.status(400).json({
                ok: false,
                error: 'Cart not found'
            })
        }

        const productExist = cartDB.products.findIndex((product) => product.imageId == imageId);

        if(productExist < 0) {
            return res.status(400).json({
                ok: false,
                error: 'El producto no se encuentra en el carrito'
            })
        }

        cartDB.products.splice(productExist, 1);

        cartDB.update(cartDB, (errUpdt, cartUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Producto eliminado del carrito correctamente'
            })
        })
    })
})


module.exports = app;
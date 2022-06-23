const express = require('express');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

const Order = require('../models/order');
const Cart = require('../models/cart');

const { getUserById } = require('../functions/usersAux')
const { generateMPOrderQR, generatePreference } = require('../functions/mercadopago')
const { cleanUserCart } = require('../functions/cartAux') 

const app = express();

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
    
    const orderData = {
      images: data.imageIds,
      subtotal: data.subtotal,
      totalAmount: data.total,
      userId: user._id,
      userEmail: data.email,
      status: 'pending',
      paymentMethod: data.paymentOption,
      photographers: getPhotographers(data.products),
      discounts: data.discounts
    }

    const order = new Order(orderData);

    order.save(async (err, orderSaved) => {
        
        if(err) {
          reject(err);
          return;
        } 

        resolve(orderSaved)

    })
  })
}

app.post('/mercadopago/preference/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], async (req, res) => {

  const order = await createOrder(req.body, req.user)

  generatePreference(req.body, order.orderId)
    .then(function (response) {
      const initPoint = response.body.init_point;

      return res.status(201).json({
        ok: true,
        initPoint
      })

    })
    .catch(function (error) {

      return res.status(500).json({
        ok: false,
        error
      })

    })
})

app.post('/mercadopago/qr/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], async (req, res) => {
    
    const order = await createOrder(req.body, req.user)

    generateMPOrderQR(req.body, order.orderId).then((resp) => {

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

  createOrder(req.body, userToUpdate).then(async(orderRes) => {

    await cleanUserCart(req.user)

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
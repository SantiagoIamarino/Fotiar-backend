const express = require('express');
const app = express();

const Order = require('../models/order');
const User = require('../models/user');
const Image = require('../models/image');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;

function updateUserPurchases(user) {
    return new Promise((resolve, reject) => {
        User.findById(user._id, (errUpdt, userDB) => {
            if(errUpdt) {
                reject(errUpdt);
            }

            userDB.purchases = user.purchases;

            userDB.update(userDB, (errUpdt, userUpdated) => {
                resolve(user.purchases);
            })
        })
    })
}


app.post('/get-orders', [mdAuth, mdRole(['ADMIN_ROLE', 'CASHIER_ROLE'])], (req, res) => {
    const filters = req.body.filters;
    const pagination = req.body.pagination;

    const mongooseFilters = {
        userEmail: new RegExp( filters.email, 'i' ),
        status: 'pending'
    }

    if(!filters.email) {
        delete mongooseFilters.userEmail;
    }

    let sortFilter = [];

    if(filters.order.by) {
        sortFilter = [[filters.order.by, filters.order.order]];
    }

    Order.count(mongooseFilters, (errCount, total) => {
        if(errCount) {
            return res.status(500).json({
                ok: false,
                error: errCount
            })
        }

        const limit = pagination.perPage;
        const skip = (pagination.actualPage * pagination.perPage) - pagination.perPage;

        Order.find(mongooseFilters)
            .skip(skip)
            .limit(limit)
            .sort(sortFilter)
            .exec((err, orders) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        error: err
                    })
                }

                return res.status(200).json({
                    ok: true,
                    orders,
                    total,
                    skip
                })
            })
    })
} )

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

app.post('/mark-as-payed/:orderId', [mdAuth, mdRole(['ADMIN_ROLE', 'CASHIER_ROLE'])], (req, res) => {
    const orderId = req.params.orderId;

    Order.findById(orderId, async (err, orderDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!orderDB || orderDB.status !== 'pending') {
            return res.status(400).json({
                ok: false,
                message: 'No existe una compra pendiente con ese ID'
            })
        }

        orderDB.status = 'completed';
        orderDB.paymentDate = new Date();
        orderDB.images = await getImages(orderDB.images);

        orderDB.update(orderDB, (errUpdt, orderUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }
            

            User.findById(orderDB.userId, async(errFind, userDB) => {
                if(errFind) {
                    return res.status(500).json({
                        ok: false,
                        error: errFind
                    })
                }

                if(!userDB) {
                    return res.status(400).json({
                        ok: false,
                        message: 'No existe un usuarios con ese ID'
                    })
                }

                orderDB.images.forEach(image => {
                    const imageId = image._id;
                    
                    if(userDB.purchases.indexOf(imageId) < 0) {
                        userDB.purchases.push(imageId);
                    }
                });

                try {
                    await updateUserPurchases(userDB);

                    return res.status(200).json({
                        ok: true,
                        message: 'Order marcada como paga correctamente'
                    })
                } catch(error) {
                    console.log(error);
                    return res.status(400).json({
                        ok: false,
                        error
                    })
                }
            })
        })

        
    })
} )


module.exports = app;
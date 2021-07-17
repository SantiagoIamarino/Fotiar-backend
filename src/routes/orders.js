const express = require('express');
const app = express();

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;

const Order = require('../models/order');


function getOwnedImages(images, photographer) {
    const imagesOwned = [];

    images.forEach(image => {
        if(image.photographerId == photographer.email || image.photographerId == photographer.username) {
            imagesOwned.push(image);
        }
    });

    return imagesOwned;
}

app.get('/:orderId', [mdAuth, mdRole(['ADMIN_ROLE', 'PHOTOGRAPHER_ROLE'])], (req, res) => {
    const orderId = req.params.orderId;

    Order.findOne({orderId: orderId})
        .populate('userId')
        .exec((error, orderDB) => {
            if(error) {
                return res.status(500).json({
                    ok: false,
                    error
                })
            }

            if(req.user.role == 'PHOTOGRAPHER_ROLE') {
                orderDB.images = getOwnedImages(orderDB.images, req.user);
            }

            return res.status(200).json({
                ok: true,
                order: orderDB
            })
        })
})

app.post('/search', [mdAuth, mdRole(['ADMIN_ROLE', 'PHOTOGRAPHER_ROLE'])], (req, res) => {
    const filters = req.body.filters;
    const pagination = req.body.pagination;

    let dateFilter = [
        { paymentDate: { $gte: filters.date.from } },
        { paymentDate: { $lte: filters.date.to } }
    ];

    if(!filters.date.from) {
        dateFilter = [
            { paymentDate: { $lte: filters.date.to } }
        ];
    }

    if(!filters.date.to) {
        dateFilter = [
            { paymentDate: { $gte: filters.date.from } }
        ];
    }

    const mongooseFilters = {
        userEmail: new RegExp( filters.email, 'i' ),
        status: filters.status,
        $and: dateFilter,
        photographers: { $all: [req.user.email] }
    }

    if(!mongooseFilters.userEmail || req.user.role !== 'ADMIN_ROLE') {
        delete mongooseFilters.userEmail;
    }

    if(req.user.role == 'ADMIN_ROLE') {
        delete mongooseFilters.photographers;
    }

    if(!filters.status) {
        delete mongooseFilters.status;
    }

    if(!filters.date.to && !filters.date.from) {
        delete mongooseFilters.$and;
    }

    if(!filters.email) {
        delete mongooseFilters.photographerId;
    }

    let sortFilter = [];

    if(filters.order.by) {
        sortFilter = [[filters.order.by, filters.order.order]];
    }

    console.log(mongooseFilters);

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
            .populate('ownerId')
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
})


module.exports = app;
const express = require('express');
const app = express();
const Image = require('../models/image');
const path = require('path');
const fs = require('fs');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdSameUser = require('../middlewares/sameUser').verifyUser;
const mdRole = require('../middlewares/role').verifyRole;

app.get('/image/:filename', [mdAuth, mdRole], (req, res) => {
    const { filename } = req.params;
    const dirname = path.resolve();
    const fullfilepath = path.join(dirname, 'src/images/' + filename);

    if(fs.existsSync(fullfilepath)) {
        return res.sendFile(fullfilepath);
    } else {
        const defaultImagePath = path.join(dirname, 'images/default.png');
        return res.sendFile(defaultImagePath);
    }
    
});

app.post('/search/admin', [mdAuth, mdRole], (req, res) => {
    const filters = req.body.filters;
    const pagination = req.body.pagination;

    let dateFilter = [
        { creationDate: { $gte: filters.date.from } },
        { creationDate: { $lte: filters.date.to } }
    ];

    if(!filters.date.from) {
        dateFilter = [
            { creationDate: { $lte: filters.date.to } }
        ];
    }

    if(!filters.date.to) {
        dateFilter = [
            { creationDate: { $gte: filters.date.from } }
        ];
    }

    const mongooseFilters = {
        photographerId: new RegExp( filters.email, 'i' ),
        $and: dateFilter
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

    Image.count(mongooseFilters, (errCount, total) => {
        if(errCount) {
            return res.status(500).json({
                ok: false,
                error: errCount
            })
        }

        const limit = pagination.perPage;
        const skip = (pagination.actualPage * pagination.perPage) - pagination.perPage;

        Image.find(mongooseFilters)
            .populate('ownerId')
            .skip(skip)
            .limit(limit)
            .sort(sortFilter)
            .exec((err, images) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        error: err
                    })
                }

                return res.status(200).json({
                    ok: true,
                    images,
                    total,
                    skip
                })
            })
    })
})

app.post('/:userId', [mdAuth, mdSameUser], (req, res) => {
    const body = req.body;

    const image = new Image(body);

    image.save((err, imageSaved) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        return res.status(201).json({
            ok: true,
            message: 'Imagen guardada correctamente'
        })
    })
})

module.exports = app;
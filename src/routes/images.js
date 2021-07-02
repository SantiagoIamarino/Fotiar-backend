const express = require('express');
const app = express();
const Image = require('../models/image');
const updateTag = require('../config/functions').updateTag;
const path = require('path');
const filesUrl = require('../config/vars').filesPath;
const fs = require('fs');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdSameUser = require('../middlewares/sameUser').verifyUser;
const mdRole = require('../middlewares/role').verifyRole;
const mdImageOwner = require('../middlewares/imageOwner').verifyOwner;

app.get('/image/:filename', [mdAuth, mdImageOwner], (req, res) => {
    const { filename } = req.params;
    const fullFilePath = path.join(filesUrl, 'users/' + filename);
    const defaultImagePath = path.join(filesUrl, 'default.png');

    if(fs.existsSync(fullFilePath)) {
        return res.sendFile(fullFilePath);
    } else {
        return res.sendFile(defaultImagePath);
    }
    
});

app.get('/image-copy/:imageId', (req, res) => {
    const { imageId } = req.params;
    Image.findById(imageId, (err, imageDB) => {
        const defaultImagePath = path.join(filesUrl, 'default.png');
        if(err || !imageDB) {
            return res.sendFile(defaultImagePath);
        }

        const filename = imageDB.copyFileName;
        const fullFilePath = path.join(filesUrl, 'users/' + filename);

        if(fs.existsSync(fullFilePath)) {
            return res.sendFile(fullFilePath);
        } 

        return res.sendFile(defaultImagePath);
    })
    
});

app.get('/image-detail/:imageId', mdAuth, (req, res) => {
    const imageId = req.params.imageId;
    const contentToRetrive = '_id copyFileName creationDate photographerId tags exifData'

    Image.findById(imageId, contentToRetrive, (err, imageDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!imageDB) {
            return res.status(400).json({
                ok: false,
                error: 'Imagen no encontrada'
            })
        }

        return res.status(200).json({
            ok: true,
            image: imageDB
        })
    })
})

app.post('/search/admin', [mdAuth, mdRole(['ADMIN_ROLE', 'PHOTOGRAPHER_ROLE'])], (req, res) => {
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
        status: (filters.showRecycled) ? 'deleted' : 'visible',
        $and: dateFilter
    }

    if(req.user.role !== 'ADMIN_ROLE') {
        delete mongooseFilters.photographerId;
        mongooseFilters.ownerId = req.user._id;
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

let contentToRetrive = 'creationDate ownerId exifData tags copyFileName fileName photographerId status uploadDate _id';

app.post('/search/client', (req, res) => {
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

    let idFilter = [];
    
    if(filters.purchases.active && filters.favorites.active) { //Both filters
        idFilter = filters.purchases.images.filter((imageId) => {
            return filters.favorites.images.indexOf(imageId) >= 0;
        })
    } else {
        if(filters.purchases.active) {
            idFilter = filters.purchases.images;
        }
    
        if(filters.favorites.active) {
            idFilter = filters.favorites.images;
        }
    }
    
    const mongooseFilters = {
        status: 'visible',
        $and: dateFilter,
        tags: { $all: filters.tags },
        _id: { $in: idFilter }
    }

    if(filters.tags.length <= 0) {
        delete mongooseFilters.tags;
    }

    if(idFilter.length <= 0) {
        delete mongooseFilters._id;
    }

    if(!filters.date.to && !filters.date.from) {
        delete mongooseFilters.$and;
    }

    let sortFilter = [];

    Image.count(mongooseFilters, (errCount, total) => {
        if(errCount) {
            return res.status(500).json({
                ok: false,
                error: errCount
            })
        }

        const limit = pagination.perPage;
        const skip = (pagination.actualPage * pagination.perPage) - pagination.perPage;

        Image.find(mongooseFilters, contentToRetrive)
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

app.post('/:userId', [mdAuth, mdRole(['ADMIN_ROLE', 'PHOTOGRAPHER_ROLE']), mdSameUser], (req, res) => {
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
            imageSaved,
            message: 'Imagen guardada correctamente'
        })
    })
})

function getPromisesArray(imageDB, remove = false) {
    let promisesArray = [];

    imageDB.tags.forEach(tag => {
        promisesArray.push(updateTag(tag, [imageDB._id], remove));
    });

    return promisesArray;
}

app.delete('/:imageId', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    const imageId = req.params.imageId;

    Image.findByIdAndDelete(imageId, (err, imageDeleted) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        // await Promise.all(getPromisesArray(imageDB, true));

        return res.status(200).json({
            ok: true,
            message: 'Imagen eliminada correctamente'
        })
    })
})

app.put('/edit-tags/:ownerId', [mdAuth, mdImageOwner], (req, res) => {
    const imageId = req.body.imageId;
    const tags = req.body.tags;

    Image.findById(imageId, async (err, imageDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!imageDB) {
            return res.status(400).json({
                ok: false,
                message: 'No se ha encontrado la imagen'
            })
        }

        if(tags) {
            let promisesArray = [];

            imageDB.tags.forEach(tag => {
                promisesArray.push(updateTag(tag, [imageDB._id], true));
            });
            
            await Promise.all(promisesArray);

            imageDB.tags = tags;
        }

        imageDB.update(imageDB, async (errUpdt, imageUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            if(tags) {
                let promisesArray = [];
    
                tags.forEach(tag => {
                    promisesArray.push(updateTag(tag, [imageDB._id]));
                });
                
                await Promise.all(promisesArray);
            }

            return res.status(200).json({
                ok: true,
                message: 'Imagen editada correctamente'
            })
        })
    })
})

app.delete('/temporarly/:ownerId', [mdAuth, mdImageOwner], (req, res) => {
    const imageId = req.query.imageId;

    Image.findById(imageId, (err, imageDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        imageDB.status = 'deleted';

        imageDB.update(imageDB, async (errUpdt, imageUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            await Promise.all(getPromisesArray(imageDB, true));

            return res.status(200).json({
                ok: true,
                message: 'Imagen enviada a la papelera correctamente'
            })
        })
    })
})

app.put('/restore/:ownerId', [mdAuth, mdImageOwner], (req, res) => {
    const imageId = req.body.imageId;

    Image.findById(imageId, (err, imageDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        imageDB.status = 'visible';

        imageDB.update(imageDB, async (errUpdt, imageUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            await Promise.all(getPromisesArray(imageDB));

            return res.status(200).json({
                ok: true,
                message: 'Imagen restaurada correctamente'
            })
        })
    })
})


module.exports = app;
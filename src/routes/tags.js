const express = require('express');
const app = express();

const Tag = require('../models/tag');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

app.post('/search', (req, res) => {
    const filter = new RegExp( req.body.filter, 'i' );
    const pagination = req.body.pagination;

    const mongooseFilters = {
        value: filter
    }

    if(!req.body.filter || req.body.filter == null) {
        delete mongooseFilters.value;
    }

    Tag.count(mongooseFilters, (errCount, total) => {
        if(errCount) {
            return res.status(500).json({
                ok: false,
                error: errCount
            })
        }

        const limit = pagination.perPage;
        const skip = (pagination.actualPage * pagination.perPage) - pagination.perPage;

        Tag.find(mongooseFilters)
            .populate('creatorId')
            .skip(skip)
            .limit(limit)
            .exec((err, tags) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        error: err
                    })
                }

                return res.status(200).json({
                    ok: true, 
                    tags,
                    total,
                    skip
                })
            })
    })
    
})

app.post('/:userId', [mdAuth, mdSameUser], (req, res) => {
    const body = req.body;

    Tag.findOne({value: body.value}, (searchError, tagFound) => {
        if(searchError) {
            return res.status(500).json({
                ok: false,
                error: searchError
            })
        }

        if(tagFound) {
            return res.status(400).json({
                ok: false,
                message: 'Este tag ya se encuentra creado'
            })
        }

        const tag = new Tag(body);
        tag.save((err, tagSaved) => {
            if(err) {
                return res.status(500).json({
                    ok: false,
                    error: err
                })
            }
    
            return res.status(201).json({
                ok: true, 
                message: 'Tag creado correctamente'
            })
    
        })
    })

    
})

app.delete('/:userId', [mdAuth, mdSameUser], (req, res) => {
    const tagId = req.query.tagId;

    Tag.findByIdAndDelete(tagId, (err, tagDeleted) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        return res.status(200).json({
            ok: true, 
            message: 'Tag eliminado correctamente'
        })
    })
})


module.exports = app;
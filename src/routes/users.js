const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtKey = require('../config/vars').jwtKey;

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;
const mdSameUserOrAdmin = require('../middlewares/sameUser').verifyUser;
const { checkEmail } = require('../aux/usersAux');

const User = require('../models/user');

const contentToRetrieve = 'name username email createdAt role registerMethod favorites purchases purchasesNetAmount observation';

app.get('/get-user/:userId', [mdAuth, mdSameUserOrAdmin], (req, res) => {
    const userId = req.params.userId;
    
    User.findById(userId, contentToRetrieve, (err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario no encontrado'
            })
        }

        return res.status(200).json({
            ok: true,
            user: userDB
        })
    })
})

app.get('/refresh-user/:userId', [mdAuth, mdSameUserOrAdmin], (req, res) => {
    const userId = req.params.userId;

    User.findById(userId, contentToRetrieve, (err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario no encontrado'
            })
        }

        const payload = {
            check: true,
            user: userDB
        }
    
        const token = jwt.sign(payload, jwtKey, {
            expiresIn: "3d"
        });

        return res.status(200).json({
            ok: true,
            token,
            user: userDB
        })
    })
})

app.post('/get-users', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    const filters = req.body.filters;
    const pagination = req.body.pagination;

    const mongooseFilters = {
        email: new RegExp( filters.email, 'i' ),
        role: filters.role
    }

    if(!filters.email) {
        delete mongooseFilters.email;
    }

    if(!filters.role) {
        delete mongooseFilters.role;
    }

    let sortFilter = [];

    if(filters.order.by) {
        sortFilter = [[filters.order.by, filters.order.order]];
    }

    User.count(mongooseFilters, (errCount, total) => {
        if(errCount) {
            return res.status(500).json({
                ok: false,
                error: errCount
            })
        }

        const limit = pagination.perPage;
        const skip = (pagination.actualPage * pagination.perPage) - pagination.perPage;

        User.find(mongooseFilters, contentToRetrieve)
            .skip(skip)
            .limit(limit)
            .sort(sortFilter)
            .exec((err, users) => {
                if(err) {
                    return res.status(500).json({
                        ok: false,
                        error: err
                    })
                }

                return res.status(200).json({
                    ok: true,
                    users,
                    total,
                    skip
                })
            })
    })
} )

app.post('/', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    const body = req.body;

    User.findOne({
        $or: [ {email: body.email}, {username: body.username} ]
    }, (err, userDB)  => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(userDB) {
            return res.status(400).json({
                ok: false,
                message: 'Ya se encuentra un usuario registrado con ese email/alias'
            })
        }

        body.password = bcrypt.hashSync(body.password, 10);

        const user = new User(body);

        user.save((errUser, userSaved) => {
            if(errUser) {
                return res.status(500).json({
                    ok: false,
                    error: errUser
                })
            }

            return res.status(201).json({
                ok: true,
                message: 'Usuario creado correctamente'
            })
        })
    })
})

app.put('/:userId', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    const userId = req.params.userId;
    const body = req.body;

    User.findById(userId, (err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un usuario con esa ID'
            })
        }

        if(body.password) {
            body.password = bcrypt.hashSync(body.password, 10);
        } else {
            body.password = userDB.password;
        }

        checkEmail(body.email, userDB.email).then((newEmail) => {
            body.email = newEmail;
 
            userDB.update(body, (errUpdt, userUpdated) => {
             if(errUpdt) {
                 return res.status(500).json({
                     ok: false,
                     error: errUpdt
                 })
             }
 
             return res.status(200).json({
                 ok: true,
                 message: 'Has editado este usuario correctamente'
             })
            })
        })
        .catch((error) => {
            return res.status(400).json(error);
        });
    })
})

app.delete('/:userId', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    const userId = req.params.userId;

    User.findById(userId, (err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un usuario con esa ID'
            })
        }

        userDB.delete((errDlt, userDeleted) => {
            if(errDlt) {
                return res.status(500).json({
                    ok: false,
                    error: errDlt
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Usuario eliminado correctamente'
            })
        })
    })
})

app.post('/take-control', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    const body = req.body;

    const payload = {
        check: true,
        user: body
    }

    const token = jwt.sign(payload, jwtKey, {
        expiresIn: "3d"
    });

    const daysToExpire = 3;
    const expiration = 1000 * 60 * 60 * 24 * daysToExpire; // three days in ms

    const tokenExpiration = new Date().getTime() + expiration;

    return res.status(200).json({
        ok: true,
        token,
        tokenExpiration,
        user: body
    })
})


module.exports = app;
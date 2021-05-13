const express = require('express');
const app = express();

const jwt = require('jsonwebtoken');
const jwtKey = require('../config/vars').jwtKey;
const bcrypt = require('bcrypt');

const User = require('../models/user');

function loginUser(user, password) {
    return new Promise((resolve, reject) => {
        if(!bcrypt.compareSync(password, user.password)) {
            reject({
                status: 400,
                message: 'La contraseña es incorrecta'
            });
        }

        user.password = '';

        const payload = {
            check: true,
            user
        }

        const token = jwt.sign(payload, jwtKey, {
            expiresIn: "3d"
        });

        resolve(token);
    })
    
}

function getTokenExpiration() {
    const daysToExpire = 3;
    const expiration = 1000 * 60 * 60 * 24 * daysToExpire; // three days in ms

    const tokenExpiration = new Date().getTime() + expiration;

    return tokenExpiration;
}

app.post('/register', (req, res) => {
    const body = req.body;

    if(!body.email || !body.username) {
        return res.status(400).json({
            ok: false,
            message: 'Debes ingresar un email/alias'
        })
    }

    User.findOne({
        $or: [ {email: body.email}, {username: body.username} ]
    }).exec((err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(userDB) {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe un usuario registrado con ese email/alias'
            })
        }

        const password = body.password;
        body.password = bcrypt.hashSync(password, 10);

        const user = new User(body);

        user.save((errSave, userSaved) => {
            if(errSave) {
                return res.status(500).json({
                    ok: false,
                    error: errSave
                })
            }

            loginUser(userSaved, password)
                .then((token) => {
                    userSaved.password = '';
                    const tokenExpiration = getTokenExpiration();

                    return res.status(200).json({
                        user: userSaved,
                        token,
                        tokenExpiration
                    })
                })
                .catch((error) => {
                    return res.status(error.status).json({
                        ok: false,
                        message: error.message
                    })
                })


        })
    })
})

app.post('/login', (req, res) => {
    const body = req.body;

    if(!body.emailOrAlias) {
        return res.status(400).json({
            ok: false,
            message: 'Debes ingresar un email/alias'
        })
    }

    User.findOne({
        $or: [ {email: body.emailOrAlias}, {username: body.emailOrAlias} ]
    }).exec((err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un usuario registrado con ese email/alias'
            })
        }

        loginUser(userDB, body.password)
            .then((token) => {
                userDB.password = '';
                const tokenExpiration = getTokenExpiration();

                return res.status(200).json({
                    user: userDB,
                    token,
                    tokenExpiration
                })
            })
            .catch((error) => {
                return res.status(error.status).json({
                    ok: false,
                    message: error.message
                })
            })
    })
})

app.post('/login-google', (req, res) => {
    const body = req.body;

    if(!body.email) {
        return res.status(400).json({
            ok: false,
            message: 'Debes ingresar un email'
        })
    }

    User.findOne({
        email: body.email,
        registerMethod: 'google'
    }).exec((err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un usuario registrado con ese email/alias'
            })
        }

        loginUser(userDB, 'google-account')
            .then((token) => {
                userDB.password = '';
                const tokenExpiration = getTokenExpiration();

                return res.status(200).json({
                    user: userDB,
                    token,
                    tokenExpiration
                })
            })
            .catch((error) => {
                return res.status(error.status).json({
                    ok: false,
                    message: error.message
                })
            })
    })
})

app.post('/renew-token', (req, res) => {
    const token = req.body.token;

    jwt.verify(token, jwtKey, (err, decoded) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        const payload = {
            check: true,
            user: decoded.user
        }

        const token = jwt.sign(payload, jwtKey, {
            expiresIn: "3d"
        });

        return res.status(200).json({
            ok: true,
            token,
            tokenExpiration: getTokenExpiration()
        })
    })
})

module.exports = app;
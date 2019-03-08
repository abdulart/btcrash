const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../config/connection');
const users = db.get('users');

users.createIndex('email', { unique: true });
const router = express.Router();

const schema = Joi.object().keys({
    email: Joi.string().max(30).required(),
    password: Joi.string().trim().min(6).required()
});

function createTokenSendResponse(user, res, next) {
    const payload = {
        _id: user._id,
        email: user.email
    };
    jwt.sign(payload, '1wb46x!fasdf!efpeurpwurjfa;sldfj941!!!jfdjfa093nn', {
        expiresIn: '1d'
    }, (err, token) => {
        if (err) {
            res.status(422);
            const error = new Error('Ошибка логина');
            next(error);
        } else {
            res.json({
                token
            });
        }
    });
}

router.get('/', (req, res) => {
    res.json({
        message: 'Hi =)'
    });
});

router.post('/signup', (req, res, next) => {
    const result = Joi.validate(req.body, schema);
    if (result.error === null) {
        users.findOne({
            email: req.body.email
        }).then(user => {
            // if user is undefined, username is not in the db
            if(user) {
                const error = new Error('Такой имейл уже зарегистрирован 😭');
                res.status(409);
                next(error);
            } else {
                bcrypt.hash(req.body.password.trim(), 12)
                    .then(hash => {
                        const newUser = {
                            email: req.body.email,
                            password: hash
                        };

                        users.insert(newUser)
                            .then(inserted_user => {
                                createTokenSendResponse(inserted_user, res, next);
                            })
                            .catch(err => {
                                console.log(err);
                            })
                    });
            }
        })
    } else {
        res.status(422);
        next(result.error);
    }
});

router.post('/login', (req, res, next) => {
    const result = Joi.validate(req.body, schema);
    if (result.error === null) {
        users.findOne({
            email: req.body.email
        })
            .then(user => {
                if (user) {
                    bcrypt.compare(req.body.password, user.password)
                        .then(result => {
                            if(result) {
                                createTokenSendResponse(user, res, next);
                            } else {
                                res.status(422);
                                const error = new Error('Неверный пароль');
                                next(error);
                            }
                        })
                } else {
                    res.status(422);
                    const error = new Error('Пользователь не найден');
                    next(error);
                }
            });
    } else {
        res.status(422);
        const error = new Error('Ошибка логина');
        next(error);
    }
});

module.exports = router;
const jwt = require('jsonwebtoken');
const db = require('../config/connection');
const users = db.get('users');

function checkTokenSetUser(req, res, next) {
    const authHeader = req.get('authorization');
    if(authHeader) {
        const token  = authHeader.split(' ')[1];
        if(token) {
            jwt.verify(token, '1wb46x!fasdf!efpeurpwurjfa;sldfj941!!!jfdjfa093nn', (error, user) => {
                if(error) {
                    console.log(error);
                }

                users.findOne({
                    email: user.email
                }).then(usr => {
                    // if user is undefined, username is not in the db
                    if(usr) {
                        const ttl_num = Math.round(usr.rub*100) /100;
                        req.user = {
                            email: usr.email,
                            token: usr.token,
                            rub: ttl_num,
                        };
                        next();
                    } else {
                        req.user = user;
                        next();
                    }
                });
            });
        } else {
            next();
        }
    } else {
        next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        const error = new Error('unathorized');
        res.status(401);
        next(error);
    }
}

module.exports = {
    checkTokenSetUser,
    isLoggedIn,
};
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const User = require('../models/user')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const verify = async (username, password, done) => {
    User.findOne({
            email: username
        }).then(user => {
            if (!user) {
                return done(null, false, {
                    message: 'Пользователя не существует'
                })
            }
            bcrypt.compare(password, user.passwordHash)
                .then(response => {
                    if (!response) {
                        return done(null, false, {
                            message: 'Не правильный пароль'
                        })
                    }
                    return done(null, user)
                })
        })
        .catch(err => done(err));
}

const options = {
    usernameField: "email",
    passwordField: "password",
}

passport.use('local', new LocalStrategy(options, verify))

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, cb) => {
    User.findById(id, (err, user) => {
        if (err) {
            return cb(err)
        }
        cb(null, user)
    })
})

router.post('/api/signin', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('users/signin', {
                error: info.message,
                status: "error",
                user: req.user

            });
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            console.log(` 
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                contantPhone: user.contantPhone
            },
            status: "ok"`);
            return res.render('index', {
                user: user
            });
        });
    })(req, res, next);
})


router.get('/', async (req, res) => {
    try {
        res.render("index", {
            user: req.user
        });
    } catch (e) {
        res.status(500).json(e)
    }
})

router.get('/api/signup', async (req, res) => {
    try {
        res.render("users/signup", {
            status: '',
            user: req.user
        });
    } catch (e) {
        res.status(500).json(e)
    }
})

router.post('/api/signup', async (req, res) => {
    let hash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
            email: req.body.email,
            passwordHash: hash,
            name: req.body.name,
            contactPhone: req.body.phone,
        }).then(resolve => {
            res.render("users/signup", {
                data: {
                    id: resolve._id,
                    email: resolve.email,
                    name: resolve.name,
                    contactPhone: resolve.contactPhone
                },
                status: "ok",
                user: req.user
            });
        })
        .catch(error => {
            res.render("users/signup", {
                error: "email занят",
                status: 'error',
                user: req.user
            });
        });
})

router.get('/api/signin', async (req, res) => {
    try {
        res.render("users/signin", {
            error: false,
            user: req.user
        });
    } catch (e) {
        res.status(500).json(e)
    }
})


router.get('/api/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.render('index', {
            user: req.user
        });
    });
})

module.exports = router
const express = require('express')
const router = express.Router()
const fileMulter = require('../middleware/file')
const Advertisement = require('../models/Advertisement')
const User = require('../models/user')
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;

moment.locale('ru');

router.post('/api/advertisements/search', async (req, res) => {
    const {
        search
    } = req.body
    let paramsSearch = new RegExp(search);
    let searchQuery;
    try {
        if (search.length === 24) {
            searchQuery = await Advertisement.find({
                $or: [{
                        shortText: {
                            $regex: paramsSearch,
                            $options: 'i'
                        }
                    },
                    {
                        description: {
                            $regex: paramsSearch,
                            $options: 'i'
                        }
                    },
                    {
                        userId: new ObjectId(search)

                    },
                    {
                        tags: search
                    }
                ]
            }).select('-__v');
        } else {
            searchQuery = await Advertisement.find({
                $or: [{
                        shortText: {
                            $regex: paramsSearch,
                            $options: 'i'
                        }
                    },
                    {
                        description: {
                            $regex: paramsSearch,
                            $options: 'i'
                        }
                    },
                    {
                        tags: search
                    }
                ]
            }).select('-__v');
        }

        res.render("advertisement/index", {
            title: "Обьявления",
            advertisement: {
                data: searchQuery,
                status: "ok"
            },
            user: req.user
        });


    } catch (e) {
        res.status(500).json(e)
    }
})


router.get('/api/advertisements', async (req, res) => {
    const data = [];

    const dataBase = await Advertisement.find({
        isDeleted: {
            $ne: true
        }
    }).select('-__v');



    const promise = dataBase.map(async (item) => {
        let userName = await User.findById(item.userId)
            .then(res =>
                data.push({
                    id: item._id.toString(),
                    shortText: item.shortText,
                    description: item.description,
                    images: item.images,
                    user: {
                        id: item.userId.toString(),
                        name: res.name
                    },
                    createdAt: item.createdAt,
                    updatedAt: moment(item.updatedAt).format('LLL'),
                }))
    })

    await Promise.all(promise)

    try {
        res.render("advertisement/index", {
            title: "Обьявления",
            advertisement: {
                data: data,
                status: "ok"
            },
            user: req.user
        });
    } catch (e) {
        res.status(500).json(e)
    }
})

router.get('/api/advertisement/remove/:id', async (req, res) => {
    const {
        id
    } = req.params
    try {
        Advertisement.findOneAndUpdate({
            _id: id
        }, {
            $set: {
                isDeleted: true
            }
        }, {
            new: true
        }, (err, doc) => {
            if (err) {
                console.log(err);
            }
            console.log(doc);
        });

        res.redirect('/api/advertisements')
    } catch (e) {
        res.status(500).json(e)
    }

})

router.get('/api/advertisements/create', async (req, res) => {
    try {
        res.render("advertisement/create", {
            title: "Создать обьявление",
            advertisement: 'advertisement',
            user: req.user
        });
    } catch (e) {
        res.status(500).json(e)
    }
})

router.get('/api/advertisements/:id', async (req, res) => {
    const {
        id
    } = req.params


    try {
        let advertisement = await Advertisement.findById(id).
        then(res => ({
                ...res._doc,
                createdAt: moment(res.updatedAt).format('LLL'),
                updatedAt: moment(res.updatedAt).format('LLL'),
                userId: res.userId.toString(),
            }))
            .then(res => {
                return res
            })

        let author = await User.findById(advertisement.userId).
        then(res => {
            return res.name
        })

        res.render("advertisement/view", {
            title: advertisement.shortText,
            user: req.user,
            advertisement: advertisement,
            author: author
        });
    } catch (e) {
        res.status(500).json(e)
    }
})



router.post('/api/advertisements/create', fileMulter.array('images', 12), async (req, res) => {
    const {
        shortText,
        description,
        tags,
    } = req.body
    const userId = req.user._id
    const images = req.files.map(item => item.path);
    const isDeleted = false;
    const createdAt = new Date();
    const data = {
        shortText,
        description,
        images,
        createdAt,
        userId,
        tags,
        isDeleted
    }
    try {
        Advertisement.create(data)
        res.redirect('/api/advertisements/create')
    } catch (e) {
        res.status(500).json(e)
    }
})

router.get('/api/advertisements/create', fileMulter.array('images', 12), async (req, res) => {
    const {
        shortText,
        description,
        tags,
    } = req.body
    const userId = req.user._id
    const images = req.files.map(item => item.path);
    const isDeleted = false;
    const createdAt = new Date();
    const data = {
        shortText,
        description,
        images,
        createdAt,
        userId,
        tags,
        isDeleted
    }
    try {
        Advertisement.create(data)
        res.redirect('/api/advertisements/create')
    } catch (e) {
        res.status(500).json(e)
    }
})

router.get('/api/advertisements/update/:id', fileMulter.array('images', 12), async (req, res) => {
    const {
        id
    } = req.params

    try {
        let advertisement = await Advertisement.findById(id).
        then(res => ({
                ...res._doc,
                userId: res.userId.toString(),
            }))
            .then(res => {
                return res
            })

        res.render("advertisement/update", {
            title: 'Редактировать ' + advertisement.shortText,
            user: req.user,
            advertisement: advertisement,
        });
    } catch (e) {
        res.status(500).json(e)
    }
})

router.post('/api/advertisements/update/:id', fileMulter.array('images', 12), async (req, res) => {
    const {
        id
    } = req.params
    const {
        shortText,
        description,
    } = req.body
    const images = req.files.map(item => item.path);

    try {
        Advertisement.findOneAndUpdate({
            _id: id
        }, {
            $set: {
                shortText: shortText,
                description: description,
                images: images,
                updatedAt: new Date(),
            }
        }, {
            new: true
        }, (err, doc) => {
            if (err) {
                console.log(err);
            }
            console.log(doc);
        });
        res.redirect('/api/advertisements')
    } catch (e) {
        res.status(500).json(e)
    }
})

module.exports = router
const express = require('express');
const userRooter = require('./routes/user');
const advertisementsRooter = require('./routes/advertisement');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config()
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const socketIO = require('socket.io');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const User = require('./models/user');
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;


mongoose.Promise = global.Promise;

const UrlDB = process.env.ME_CONFIG_MONGODB_URL
const DATABESE = process.env.ME_CONFIG_MONGODB_DATABASEE
const PORT = process.env.PORT || 7070


const app = express()
app.use(express.static('public/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cors());
app.set('view engine', 'ejs')
app.use(session({
    secret: 'SECRET'
}));

app.use(passport.initialize())
app.use(passport.session())

app.use('/', userRooter)
app.use('/', advertisementsRooter)


const server = app.listen(PORT, async () => {
    try {
        console.log(`Server listener  on port ${PORT}`);
        await mongoose.connect('mongodb://root:example@mongo:27017/users?authSource=admin', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(() => {
            console.log('Database connected')
        }, error => {
            console.log('Database cant be connected: ' + error)
        })

    } catch (e) {
        console.log(e);
    }
});

const io = socketIO(server);

io.on('connection', (socket) => {
    const {
        id
    } = socket;
    const {
        roomName
    } = socket.handshake.query;
    socket.join(roomName);

    socket.on('getHistory', async (msg) => {
        let chat, promise;
        let dataChat = [];

        async function getChat(arr) {
            promise = arr.map(async (item) => {
                let dataArr = [];
                let user1 = await User.findById(item.users[0]).
                then(res => res.name);
                let user2 = await User.findById(item.users[1]).
                then(res => res.name);
                const arrayMessages = item.messages.map(async (el) => {

                    await Message.findById(el).
                    then(res => {
                        dataArr.push({
                            author: res.author.toString() === item.users[0].toString() ? user1 : user2,
                            readAt: res.readAt,
                            sentAt: moment(res.sentAt).format('LLL'),
                            text: res.text,
                            messageId: el,
                        })
                    });
                })
                await Promise.all(arrayMessages)
                dataChat.push({
                    advertisementId: item.advertisementId,
                    createdAt: moment(item.createdAt).format('LLL'),
                    messages: dataArr,
                    users: [user1, user2],
                    usersId: [item.users[0], item.users[1]],
                    _id: item._id,
                })
            })
            await Promise.all(promise)
        }

        if (msg.userAdvertisementId) {
            chat = await Chat.find({
                $and: [{
                    users: {
                        $all: [new ObjectId(msg.userId), new ObjectId(msg.userAdvertisementId)]
                    }
                }, {
                    advertisementId: new ObjectId(msg.advertisementId)
                }]
            }).select('-__v')
            await getChat(chat)

        } else {
            chat = await Chat.find({
                $and: [{
                    users: new ObjectId(msg.userId)
                }, {
                    advertisementId: new ObjectId(msg.advertisementId)
                }]
            }).select('-__v')
            await getChat(chat)        }

        socket.emit('chatHistory', {
            dataChat: dataChat,
            chatId: msg.chatId

        })
    })

    socket.on('sendMessage', async (msg) => {
        try {
            const chat = await Chat.find({
                $and: [{
                    users: {
                        $all: [new ObjectId(msg.receiver), new ObjectId(msg.user)]
                    }
                }, {
                    advertisementId: new ObjectId(msg.advertisementId)
                }]
            }).select('-__v');


            const message = await Message.create({
                author: msg.user,
                sentAt: new Date(),
                text: msg.text,
            });

            let userName = await User.findById(message.author)
                .then(res => res.name)


            if (chat.length == 0) {
                await Chat.create({
                    users: [new ObjectId(msg.receiver), new ObjectId(msg.user)],
                    createdAt: new Date(),
                    messages: [message._id],
                    advertisementId: new ObjectId(msg.advertisementId),
                })
            } else {
                chat.map(async (el, idx) => {
                    if (el._id.toString() === msg.chatId) {
                        chat[idx].messages.push(message._id);
                        await chat[idx].save();
                    }
                })

            }

            socket.emit('newMessage', {
                message: {
                    userName: userName,
                    readAt: message.readAt,
                    date: moment(message.sentAt).format('LLL'),
                    text: message.text,
                    messageId: message._id,
                }
            })

        } catch (e) {
            socket.emit('error', {
                message: 'Error update advertisement',
            });
        }
    });

    socket.on('readMessage', async ({
        id
    }) => {
        try {
            Message.findOneAndUpdate({
                _id: id
            }, {
                $set: {
                    readAt: new Date()
                }
            }, {
                new: true
            }, (err, doc) => {
                if (err) {
                    console.log(err);
                }
            });

        } catch (e) {
            socket.emit('error', {
                message: 'Error update messages',
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${id}`);
    });
});
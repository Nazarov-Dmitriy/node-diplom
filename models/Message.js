const {
    Schema,
    model
} = require('mongoose')

const MessageSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    sentAt: {
        type: Date,
        required: true,
    },
    text: {
        type: String,
    },
    readAt: {
        type: Date,
        default: '',
    },
})


module.exports = model("Message", MessageSchema);
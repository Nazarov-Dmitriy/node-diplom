const {
    Schema,
    model
} = require('mongoose')

const ChatShema = new Schema({
    users: {
        type: [Schema.Types.ObjectId, Schema.Types.ObjectId],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    messages: {
        type: [String],
    },
    advertisementId: {
        type: Schema.Types.ObjectId,
        required: true,
    }
})


module.exports = model("Chat", ChatShema);
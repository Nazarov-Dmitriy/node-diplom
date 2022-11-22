const {
    Schema,
    model
} = require('mongoose')

const advertisementShema = new Schema({
    shortText: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    images: {
        type: [String],
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    tags: {
        type: [String],
    },
    isDeleted: {
        type: Boolean,
        required: true,
    },
})


module.exports = model("Advertisement", advertisementShema);
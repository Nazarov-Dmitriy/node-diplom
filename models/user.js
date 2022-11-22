const {
    Schema,
    model
} = require('mongoose')

const userShema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    contactPhone: {
        type: String,
    },
})

module.exports = model("User", userShema);


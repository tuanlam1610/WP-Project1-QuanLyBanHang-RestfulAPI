const mongoose = require('mongoose');

const imgSchema = new mongoose.Schema({
    data: Buffer,
})

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

const bookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    author: {
        type: String,
        required: true
    },
    publishedYear: {
        type: Number,
        min: 1600
    },
    imagePath: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Img"
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }
})

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        unique: true
    },
    listOfBook: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    }]
})

const orderSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    listOfBook: [{
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true
        },
        quantity: {
            type: Number,
            min: 1,
            default: 1,
            required: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    }
})

let User = mongoose.model("User", userSchema);
let Book = mongoose.model("Book", bookSchema);
let Category = mongoose.model("Category", categorySchema);
let Order = mongoose.model("Order", orderSchema);
let Img = mongoose.model("Img", imgSchema)

module.exports = { User, Book, Category, Order, Img }
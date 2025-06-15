const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    instrument: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        enum: ['PLN', 'USD', 'EUR', 'GBP']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema); 
const mongoose = require('mongoose');

let orgSchema = {
    "id" : {
        type: String,
        required: true,
        unique: true
    },
    "name": {
        type: String,
    },
    "description": {
        type: String,
    },
    "teachers": {
        type: Array,
    },
    "owners": {
        type: Array,
    },
    "billing_email" : {
        type: String,
    },
    "next_billing_date" : {
        type: String,
    }

}


module.exports = mongoose.model('Org', orgSchema)

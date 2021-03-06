const mongoose = require('mongoose');

let classSchema = {
    "id" : {
        type: String,
        required: true, 
        unique: true
    },
    "name": {
        type: String,
        required: true,
    },
    "description": {
        type: String,
        required: false
    },
    "org_id" : {
        type: String,
        required: false,
        unique: false
    },
    "assignments" : {
        type: Object,
        required: false
    },
    "teachers" : {
        type: Array
    },
    "members" : {
        type: Array,
        required: true
    },
    "orgLimit" : {
        type: Number,
        required: true
    },
    "orgName" : {
        type: String,
        required: false
    }
}


module.exports = mongoose.model('Class', classSchema)

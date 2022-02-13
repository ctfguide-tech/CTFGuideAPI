const mongoose = require('mongoose');

let userSchema = {
    "uid" : {
        type: String,
        required: true, 
        unique: true
    },
    "email": {
        type: String,
        required: true,
        unique: true,
    },
    "createdChallenges" : {
        type: Object
    },
    "points": {
        type: Number
    },
    "createdClasses" : {
        type: Object
    },
    "classes" : {
        type: Object
    },
    "history" : {
        type: Object
    },
    "streak" : {
        type: Number
    },
    "solvedChallenges" : {
        type: Object
    },
    "username" : {
        type: String
    },
    "stibarc_username" : {
        type: String
    },
    "vmPassword" : {
        type: String
    },
    "vmUsername" : {
        type: String
    }
}


module.exports = mongoose.model('User', userSchema)

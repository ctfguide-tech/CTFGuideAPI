const mongoose = require('mongoose');

let challengeSchema = {
    "challengeName": {
        type: String,
        required: true
    },
    "category": {
        type: String
    },
    "challengeAuthor": {
        type: String
    },
    "difficulty" : {
        type: String
    },
    "platform" : {
        type: String
    },
    "title" : {
        type: String
    },
    "views" : {
        type: Number
    }
}


module.exports = mongoose.model('Challenge', challengeSchema)

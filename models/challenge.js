const mongoose = require('mongoose');

let challengeSchema = {
    "id": {
        type: String,
        require: true
    },
    "title": {
        type: String,
        required: true
    },
    "category": {
        type: String
    },
    "author": {
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
    },
    "attempts" : {
        type: Number
    },
    "problem" : {
        type: String
    },
    "solution" : {
        type: String
    },
    "goodAttempts" : {
        type: Number
    },
    "ctflearn_url" : {
        type: String
    },
    "points" : {
        type: Number
    },
    "leaderboard" : {
        type: Object
    }
}


module.exports = mongoose.model('Challenge', challengeSchema)

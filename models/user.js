const mongoose = require('mongoose');

let userSchema = {
    "uid" : {
        type: String,
        required: true
    },
    "age" : {
        type: Number
    },
    "otp" : {
        type: String
    },
    "emailVerified" : {
        type: Boolean,
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
        type: Array
    },
    "history" : {
        type: Object
    },
    "streak" : {
        type: Number
    },
    "lastSolvedDate" : {
        type: Date
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
    },
    "pro" : {
        type: Boolean
    },
    "country" : {
        type: String
    },
    "tutorialComplete" : {
        type: Boolean
    },
    "comments" : {
        type: Array
    },
    "lessonProgress" : { 
        type: Object
    },
    "lessonsCompleted" : {
        type: Array
    }
}


module.exports = mongoose.model('User', userSchema)

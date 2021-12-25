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
    }
}


module.exports = mongoose.model('User', userSchema)

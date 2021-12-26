const mongoose = require('mongoose');

let solutionSchema = {
    "id" : {
        type: String,
        required: true, 
    },
    "solution": {
        type: String,
    }
}


module.exports = mongoose.model('Solution', solutionSchema)

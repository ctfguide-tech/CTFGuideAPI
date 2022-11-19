const mongoose = require('mongoose');

let orgSchema = {
    "id": {
        type: String,
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
    "admin": {
        type: Array,
    },
    "owner": {
        type: String,
    },
    "billing_email": {
        type: String,
    },
    "next_billing_date": {
        type: String,
    },
    "activated": {
        type: Boolean,
    },
    "dateActivated": {
        type: String,
    },
    "inviteCode": {
        type: String,
    },
    "oid_billing": {

        type: String,
    },
    "totalStudents" : 0,
    "totalTeachers" : 0,
    "plan" : ""


}


module.exports = mongoose.model('Org', orgSchema)

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

let urlencodedParser = bodyParser.urlencoded({
    extended: true
})

router.use(bodyParser.json());
let challengeModel = require("../models/challenge.js");
let solutionModel = require("../models/solution.js");
let userModel = require("../models/user.js");
let classModel = require("../models/class.js");
let orgModel = require("../models/org.js");

const fs = require("fs");
const { create } = require('../models/class.js');
const { response } = require('express');

console.log("[OK] Organization Model Loaded /api/orgs");
// load payment session for checkout.ctfguide.com
router.get('/loadPayment', async (req, res) => {
    let orgdata = await orgModel.findOne({
        oid_billing: req.query.oid
    });

   // var uid = orgdata.owner;
    var amount = 0;
    // get user object
    let userdata = await userModel.findOne({
        uid: uid
    });

    if (orgdata.plan == "peruser") {
        amount = 2.00 * orgdata.totalStudents;
        amount += 3.00 * orgdata.totalTeachers;
    } else if (orgdata.plan == "general") {
        amount = 400.00;
    } else {
        return res.status(400).send("Invalid Plan");
    }


    if (orgdata) {
        res.send({
            email: userdata.email,
            amount: amount,
            name: userdata.username
        });
    }
});
// Create a new organization (standard)
router.get("/create", async (request, response) => {
    var uid = request.query.uid;


    if (!uid) {
        response.status(400).send("Missing uid");
        return;
    }

    let user = await userModel.findOne({
        uid: uid
    });

    if (!user) {
        response.status(400).send("Invalid uid");
        return;
    }

    // create organization
    let org = new orgModel({
        name: "New Organization",
        description: "This is a new organization",
        teachers: [],
        admin: [uid],
        owner: uid,
        billing_email: "",
        next_billing_date: "",
        activated: false,
        dateActivated: "",
        inviteCode: ""
    });

    // push to db
    await org.save();
    


    

    



});

// Fetch organization information
router.get("/fetch", async (request, response) => {
    var uid = request.query.uid;
    var orgid = request.query.orgid;

    // get organization information
    let org = await orgModel.findOne({
        id: orgid
    });

    if (!org) {
        response.status(400).send("Invalid orgid");
        return;
    }

    // get user information
    let user = await userModel.findOne({
        uid: uid
    });


    // check user org enrollment
    if (!user.orgEnrollment.id == org.id) {
        response.status(400).send("User not enrolled in organization");
        return;
    }

    // determine role
    var role = user.orgEnrollment.role;

    if (role == "admin" || role == "owner") {
        response.status(200).send(org);
        return;
    } else {

        var safeOrg = {
            "id": org.id,
            "name": org.name,
            "description": org.description,
            "inviteCode": org.inviteCode,
        }

        response.status(200).send(safeOrg);
        return;

    }
});

module.exports = router;

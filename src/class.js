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
const fs = require("fs");


// Create a new class (standard)
router.get("/create-class/standard", async (request, response) => {
    let uid = request.query.uid;
    if (!uid) {
        response.status(400).send("Missing uid");
        return;
    }

    if (!request.query.name) {
        return response.status(400).send("Missing name");
    }
    

    if (!request.query.description) {
        return response.status(400).send("Missing description");
    }

    // Generate a unique class ID.
    let classId = (Math.random() * 10000000000000000).toString(12);
    let orgList = fs.readFileSync("./private/group.json", "utf8");

    let orgs = JSON.parse(orgList);
    let neededOrgData;


    if (request.query.org_id) {
   
        for (var i = 0; i < orgs[`organizations`].length; i++) {
            console.log(orgs[`organizations`][i].id);

            if (orgs[`organizations`][i].id == request.query.org_id) {
               // console.log("Found org");
                neededOrgData = orgs[`organizations`][i];
                break;
            }


        }

        if (!neededOrgData) {
            return response.status(400).send("Invalid org_id");
        }
       

        // sync up this data with mongodb
        const newClass = new classModel({
            id: classId,
            name: request.query.name,
            description: request.query.description,
            org_id: request.query.org_id,
            assignments: {}
        });

        newClass.save((err, data) => {
            if (err) {
                console.log(err);
                return response.status(500).send("Error saving class");
            }
            console.log("Class saved");
            return response.status(200).send(data);
        });
      //  return response.send(neededOrgData);




  
    } else {

    }
/*
    const newClass = new classModel({
        id: classId,
        name: "Standard Class",
        description: "This is a standard class.",
        org_id: "none",
        assignments: {}
    });*/

});


// Create a new clas under an organization





module.exports = router;

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
    let orgLimit = 10;

    if (request.query.org_id) {
   
        for (var i = 0; i < orgs[`organizations`].length; i++) {
            console.log(orgs[`organizations`][i].id);

            if (orgs[`organizations`][i].id == request.query.org_id) {
               // console.log("Found org");
                neededOrgData = orgs[`organizations`][i];
                orgLimt = neededOrgData.limit;
                break;
            }


        }

        if (!neededOrgData) {
            return response.status(400).send("Invalid org_id");
        }
       

        if (neededOrgData.teachers.includes(request.query.uid)) {
            
            // Update group data
            orgs.classes.push(classId);
            fs.writeFileSync("./private/group.json", JSON.stringify(orgs));
            
            const newClass = new classModel({
                id: classId,
                name: request.query.name,
                description: request.query.description,
                org_id: request.query.org_id,
                assignments: {},
                teachers: [`${request.query.uid}`],
                orgLimit: orgLimit,
                members: []
            });

            newClass.save((err, data) => {
                if (err) {
                    console.log(err);
                    return response.status(500).send("Error saving class");
                }

                if (data) {
                    if (neededOrgData.name) {
                        console.log("[CLASS] A new class was created for " + neededOrgData.name);
                    } else {
                        console.log("[CLASS] A new class was created.")
                    }
                    return response.status(200).send(data);
                }
            });

    } else {
            return response.status(400).send("You are not a teacher in this organization");
    }
      //  return response.send(neededOrgData);




  
    } else {
      
        const newClass = new classModel({
            id: classId,
            name: request.query.name,
            description: request.query.description,
            assignments: {},
            teachers: [`${request.query.uid}`],
            orgLimit: orgLimit,
            members: []
        });

        newClass.save((err, data) => {
            if (err) {
                console.log(err);
                return response.status(500).send("Error saving class");
            }

            if (data) {
                if (neededOrgData.name) {
                    console.log("[CLASS] A new class was created for " + neededOrgData.name);
                } else {
                    console.log("[CLASS] A new class was created.")
                }
                return response.status(200).send(data);
            }
        });

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


// Join Classes

router.get("/join-classes", async (request, response) => {
    let uid = request.query.uid;
    let inviteCode = request.query.inviteCode;


    if (!uid) {
        response.status(400).send("Missing uid");
        return;
    }


    if (!classId) {
        return response.status(400).send("Missing classId");
    }

    let userData = await userModel.findOne({
        id: uid
    });

    if (!userData) {
        return response.status(400).send("Invalid user");
    }

    let classData = await classModel.findOne({
        inviteCode: inviteCode
    });

    if (!classData) {
        return response.status(400).send("Invalid class");
    }

    if (classData.members.length > classData.orgLimit) {
        return response.status(400).send("Class is full");
    } else {
        if (classData.members.includes(uid)) {
            return response.status(400).send("You are already a member of this class");
        } else {
            classData.members.push(uid);
            userData.classes.push(classData.id);
            classData.save((err, data) => {
                if (err) {
                    console.log(err);
                    return response.status(500).send("Error saving class");
                }

                if (data) {
                    return response.status(200).send({
                        "status" : "OK",
                        "message": "Successfully joined class"
                    });
                }
            });
        }
    }






});





module.exports = router;

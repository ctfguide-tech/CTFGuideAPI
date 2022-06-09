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
const { create } = require('../models/class.js');
const e = require('express');


// Create a new class (standard)
router.get("/create-class/standard", async (request, response) => {
    var uid = request.query.uid;
    if (!uid) {
        response.status(400).send("Missing uid");
        return;
    }

    // check UID legitimacy
    let user = await userModel.findOne({
        uid: uid
    });
    let createdClasses = [];
    // store classes
    if (user.createdClasses) {

        createdClasses = user.createdClasses;



    }

   // console.log(createdClasses)
    if (!user) {
        response.status(400).send("Invalid uid");
        return;
    }



    if (!request.query.name) {
        return response.status(400).send("Missing name");
    }


    if (!request.query.description) {
        return response.status(400).send("Missing description");
    }

    // Generate a unique class ID.
    var classId = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

    createdClasses.push(classId)
    user.updateOne({ createdClasses: createdClasses }, function (err, res) {
        if (err) {
            console.log(err)
        } else {
            console.log(res)
        }
    })
    console.log(classId)
    var orgList = fs.readFileSync("./private/group.json", "utf8");

    var orgs = JSON.parse(orgList);
    var neededOrgData;
    var orgLimit = 10;
    let classPos = 0;

    if (request.query.orgID) {

        for (var i = 0; i < orgs[`organizations`].length; i++) {
            // console.log(orgs[`organizations`][i].id);

            if (orgs[`organizations`][i].id == request.query.orgID) {
                // console.log("Found org");
                neededOrgData = orgs[`organizations`][i];
                orgLimt = neededOrgData.limit;
                classPos = i;
                break;
            }


        }

        if (!neededOrgData) {
            console.log("Org not found");
            return response.status(400).send("Invalid org_id");
        }

        let teacherList = [];
        for (var z = 0; z < neededOrgData.teachers.length; z++) {
            teacherList.push(neededOrgData.teachers[z].uid);
        }


        if (teacherList.includes(request.query.uid)) {

            // Update group data
            orgs[`organizations`][`${classPos}`].classes.push(classId);

            fs.writeFileSync("./private/group.json", JSON.stringify(orgs));
            userModel.updateOne(({
                uid: uid
            }, { $set: { createdClasses: createdClasses } }), (err, res) => {
                if (err) {
                    console.log(err);
                }
            });

            console.log("New Class Preview: "); 
            console.log(`Class ID: ${classId}\nName: ${request.query.name}
            \nDescription: ${request.query.description}
            \nOrg ID: ${request.query.orgID}
            \nOrg Limit: ${orgLimit}
            \nOrg Name: ${neededOrgData.name}`);
            
            
            const newClass = new classModel({
                id: classId,
                name: request.query.name,
                description: request.query.description,
                org_id: request.query.orgID,
                orgName: neededOrgData.name,
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
                    return response.status(200).send("OK");

                }
            });

      
         //   return response.status(200).send("OK");

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
                // if (neededOrgData.name) {
                //      console.log("[CLASS] A new class was created for " + neededOrgData.name);
                //   } else {
                console.log("[CLASS] A new class was created.")
                //    }
                return response.status(200).send("OK");
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

router.get("/join-class", async (request, response) => {
    console.log("HIT")
    let uid = request.query.uid;
    let inviteCode = request.query.inviteCode;


    if (!uid) {
        response.status(400).send("Missing uid");
        return;
    }

    // check if uid is legit
    let user = await userModel.findOne({
        uid: uid
    });
    if (!user) {
        response.status(400).send("Invalid uid");
        return;
    }

    if (!inviteCode) {
        return response.status(400).send("Missing classId");
    }

    let userData = await userModel.findOne({
        uid: uid
    });

    if (!userData) {
        return response.status(400).send("Invalid user");
    }

    let classData = await classModel.findOne({
        id: inviteCode
    });

    if (!classData) {
        return response.status(400).send("Invalid class");
    }

    if (classData.members.length > classData.orgLimit) {
        return response.status(400).send("Class is full");
    } else {
        console.log(classData.members)
        if (classData.members.includes(uid)) {
            return response.status(400).send("You are already a member of this class");
        } else {
            classData.members.push(uid);
            userData.classes.push(classData.id);
            userData.save((err1, data1) => {
                if (err1) {
                    return response.status(500).send("Error saving user");
                }

                console.log(data1)
                classData.save((err, data) => {
                    if (err) {
                        console.log(err);
                        return response.status(500).send("Error saving class");
                    }

                    if (data) {
                        return response.status(200).send({
                            "status": "OK",
                            "message": "Successfully joined class"
                        });
                    }
                });
            })

        }
    }






});


// Fetch student class and related data
// NOTE THIS ALSO SENDS CLASSES STUDENT MAY OWN
// So are you even really a student...
router.get("/student/my-classes", async (request, response) => {
    let uid = request.query.uid;
    // Check UID legit
    let userData = await userModel.findOne({
        uid: uid
    });

    if (!userData) {
        console.log("User doesn't exist")

        return response.status(400).send("Invalid user");
    }

    let studentClasses = [];
    let createdClasses = [];
    studentClasses = userData.classes;
    createdClasses = userData.createdClasses;


    if (!studentClasses || studentClasses.length == 0 || !createdClasses || createdClasses.length == 0) {
        // console.log("Error - User not in classes")
        return response.status(400).send("You are not a member of any classes");
    }

    for (var i = 0; i < createdClasses.length; i++) {
        studentClasses.push(createdClasses[i])
    }
    // query each class id in studentClasses
    let classData = await classModel.find({
        id: {
            $in: studentClasses,
        }
    });

    let finalCopy = [];

    for (var z = 0; z < classData.length; z++) {

        let teachers = await userModel.find({
            uid: {
                $in: classData[z].teachers
            }
        });

        console.log(teachers[0]);

        let organizationName = "";
       // if (classData[z].org)
        let safeTeachers = [];
        
        for (var x = 0; x < teachers.length; x++) {
            safeTeachers.push(teachers[x].username)
        }
        
        let generatedJSON = {
            "name": classData[z].name,
            "description": classData[z].description,
            "teachers": safeTeachers,
            "organization": organizationName,
            "classId": classData[z].id,
        }
        // push each teacher name into the array teacherList

        for (var i = 0; i < teachers.length; i++) {
            generatedJSON.teachers.push(teachers[i].username);
        }

        //teachers.forEach(teacher => function () {
        //     generatedJSON.teachers.push(teacher.username);
        //})

        // query the organization name
        if (classData[z].orgName) {
            generatedJSON.organization = classData[z].orgName;
        }



        finalCopy.push(generatedJSON);
    }



    console.log(classData.teachers);


    // ONLY FOR TESTING!!!
    // REMOVE FOR PROD - THIS LEAKS UIDS
    return response.status(200).send(finalCopy);


});

// Fetch data for specific class
router.get("/:classid/info", async (request, response) => {
    if (!request.params.classid) return response.status(400).send("Missing classid");

    let classData = await classModel.findOne({
        id: request.params.classid
    });

    if (!classData) {
        return response.status(400).send("Invalid class");
    }

    console.log("[DEBUG]: Class info requested for " + classData.name);


    // Since we store ID's and not usernames, we'll need to query the database for their usernames using the ID's.
    // ID's should never be able to be seen by the end of user as they act as the token for the account.
    // Tbh, this really isn't a smart idea. In the future, we'll need to change how we identify users.

    let safeMembers = [];
    let safeTeachers = [];

    for (var i = 0; i < classData.teachers.length; i++) {
        let teacherData = await userModel.findOne({
            uid: classData.teachers[i]
        })

        

      //  console.log(teacherData)

        if (teacherData && teacherData.username) {
            safeTeachers.push(teacherData.username);
        }

    }

    for (var z = 0; z < classData.members.length; z++) {
        let memberData = await userModel.findOne({
            uid: classData.members[z]
        })

        if (memberData && memberData.username) {
            safeMembers.push(memberData.username);
        }
    }

    console.log(classData.teachers)



    if (classData.members.includes(request.query.uid) || classData.teachers.includes(request.query.uid)) {
        return response.status(200).send({
            "name": classData.name,
            "description": classData.description,
            "teachers": safeTeachers,
            "members" : safeMembers
        })
    } else {
        return response.status(400).send("You are not a member of this class");
    }

});

module.exports = router;

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
    var uid = request.query.uid;
    if (!uid) {
        response.status(400).send("Missing uid");
        return;
    }

    // check UID legitimacy
    let user = await userModel.findOne({
        uid: uid
    });
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

    console.log(classId)
    var orgList = fs.readFileSync("./private/group.json", "utf8");

    var orgs = JSON.parse(orgList);
    var neededOrgData;
    var orgLimit = 10;
    let classPos = 0;

    if (request.query.org_id) {
   
        for (var i = 0; i < orgs[`organizations`].length; i++) {
            console.log(orgs[`organizations`][i].id);

            if (orgs[`organizations`][i].id == request.query.org_id) {
               // console.log("Found org");
                neededOrgData = orgs[`organizations`][i];
                orgLimt = neededOrgData.limit;
                classPos = i;
                break;
            }


        }

        if (!neededOrgData) {
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
            
            const newClass = new classModel({
                id: classId,
                name: request.query.name,
                description: request.query.description,
                org_id: request.query.org_id,
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
                            "status" : "OK",
                            "message": "Successfully joined class"
                        });
                    }
                });
            })
           
        }
    }






});

router.get("/student/my-classes", async (request, response) => {
    let uid = request.query.uid;
    // Check UID legit
    let userData = await userModel.findOne({
        uid: uid
    });

    if (!userData) { 
        return response.status(400).send("Invalid user");
    }

    let studentClasses = userData.classes;
    if (!studentClasses) {
        return response.status(400).send("You are not a member of any classes");
    }

    // query each class id in studentClasses
    let classData = await classModel.find({
        id: {
            $in: studentClasses
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
    
    let generatedJSON = {
        "teachers" : [],
        "organization" : "",
        "classId" : request.query.inviteCode,
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


module.exports = router;

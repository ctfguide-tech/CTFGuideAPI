const admin = require('firebase-admin');
const serviceAccount = require("./private/firebaseAdminKey.json")
const secret = require("./private/secret.json")

const fs = require("fs")
// DB Imports
const mongoose = require('mongoose');
mongoose.connect(secret.mongodb)
.catch(error => console.log(error));
let ChallengeModel = require('./models/challenge.js')
let UserModel = require('./models/user.js')
let SolutionModel = require('./models/solution.js')

// Configuration
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
const { getAuth } = require('firebase-admin/auth');

// Firestore
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

let legacyData = {
    challenges: [],
    solutions: []
};


// This burns Firebase reads
async function importChallenges() {
    console.log("Importing challenges...")
    const challengeCollection = db.collection("challenges");
    const challengeQuery = await challengeCollection.get();
    challengeQuery.forEach(async challenge => {
        console.log("🤔 Attempting to import " + challenge.data().title)
        let dataObj = challenge.data();
        dataObj.id = challenge.id;
        let allowedPoints = 0;
        if (dataObj.difficulty == "easy") {
            allowedPoints = 100;
        } else if (dataObj.difficulty == "medium") {
            allowedPoints = 200;
        } else if (dataObj.difficulty == "hard") {
            allowedPoints = 300;
        }
        
        if (!dataObj.ctflearn_url) {
        let newChallenge = new ChallengeModel({
                id: challenge.id,
                attempts: dataObj.attempts,
                category: dataObj.category,
                author: dataObj.challenge_author,
                ctflive_enabled: true,
                difficulty: dataObj.difficulty,
                goodAttempts: dataObj.gattempts,
                title: dataObj.title,
                views: dataObj.views,
                platform: dataObj.platform,
                ctflearn_url: dataObj.ctflearn_url,
                problem: dataObj.problem,
                points: allowedPoints
        })
          
        newChallenge.save()
            .then(doc => {
                    console.log(`✅ Imported ${challenge.id} as ${doc.id}`);
            })
            .catch(err => {
                  return console.log(err);
            })
        }
    });
}



async function importUsers() {
    let listOfUsers = [];
    console.log("Importing users...")
    const userCollection = db.collection("users");
    const userQuery = await userCollection.get();
    userQuery.forEach(async user => {
        let dataObj = user.data();
        dataObj.id = user.id;
        
        getAuth()
        .getUser(user.id)
        .then((userRecord) => {
            dataObj.email = userRecord.email
            console.log("🤔 Attempting to import " + dataObj.email)

            let usernameFinal = dataObj.username;

            if (listOfUsers.includes(dataObj.username)) {
                usernameFinal = dataObj.username + Math.random().toString(36).substring(7);
            }

            listOfUsers.push(dataObj.username);
            let newUser = new UserModel({
                    uid: user.id,
                    email: dataObj.email,
                    streak: 0,
                    points: 0,
                    createdClasses: [],
                    history: [],
                    classes: [],
                    createdChallenges: [],
                    username: usernameFinal,
                    solvedChallenges: [],
                    stibarc_username: dataObj.stibarc_username
            })
              
            newUser.save()
                .then(doc => {
                        console.log(`📨 Imported ${dataObj.email} as ${doc.id}`);
                })
                .catch(err => {
                      return console.log(err);
                })
        })
        .catch((err) => {
            console.log("Failured to import " + user.id);
        })
        });
        
}

async function importSolutions() {
    console.log("Importing solutions...")
    const solutionCollection = db.collection("solutions");
    const solutionQuery = await solutionCollection.get();
    solutionQuery.forEach(async challenge => {
        console.log("🤔 Attempting to import " + challenge.data().solution)
        let dataObj = challenge.data();
        dataObj.id = challenge.id;

        let newSolution = new SolutionModel({
                id: challenge.id,
                solution: dataObj.solution
        })
          
        newSolution.save()
            .then(doc => {
                    console.log(`✅ Imported ${challenge.id} as ${doc.id}`);
            })
            .catch(err => {
                  return console.log(err);
            })
    });
}

importChallenges()

const express = require('express')
const app = express();
app.use(express.static('public'));
const router = express.Router();
const mongoose = require('mongoose');
const users = require("./src/user.js");
const challenges = require("./src/challenge.js");
const classes = require("./src/class.js")
const secret = require("./private/secret.json")
var http = require("http").createServer(app);
const admin = require('firebase-admin');
const serviceAccount = require("./private/firebaseAdminKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

db.settings({ ignoreUndefinedProperties: true })

app.use("/users", users);
app.use("/challenges", challenges);
app.use("/classes", classes);



// MongoDB Stuff
mongoose.connect(secret.mongodb)
.catch(error => console.log(error));
let UserModel = require('./models/user.js')
let ChallengeModel = require('./models/challenge.js')







/*
    let newUser = new UserModel({
        _id: "AB2C",
        email: 'laphat2ize@protonmail.com'
    })

    newUser.save()
      .then(doc => {
        console.log(doc)
      })
      .catch(err => {
        console.error(err)
    })

    let newChallenge = new ChallengeModel({
      _id: "AB2C",
      challengeName: 'Bruh moment'
    })

    newChallenge.save()
    .then(doc => {
      console.log(doc)
    })
    .catch(err => {
      console.error(err)
    })
*/


http.listen(3001, () => {
  console.log("CTFGuide API is deployed on server port 3001.");
})
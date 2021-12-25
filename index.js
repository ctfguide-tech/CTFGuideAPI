const express = require('express')
const app = express();
app.use(express.static('public'));
const router = express.Router();
const mongoose = require('mongoose');
const users = require("./src/user.js");
const challenges = require("./src/challenge.js");
const classes = require("./src/class.js");
const cors = require("cors");
const secret = require("./private/secret.json")
const http = require("http").createServer(app);
const admin = require('firebase-admin');
const serviceAccount = require("./private/firebaseAdminKey.json")
const { initializeApp } = require('firebase-admin/app');
initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use("*", cors())
app.use("/users", users);
app.use("/challenges", challenges);
app.use("/classes", classes);



// MongoDB Stuff
mongoose.connect(secret.mongodb)
.catch(error => console.log(error));
let UserModel = require('./models/user.js')
let ChallengeModel = require('./models/challenge.js')


http.listen(3001, () => {
  console.log("CTFGuide API is deployed on server port 3001.");
})
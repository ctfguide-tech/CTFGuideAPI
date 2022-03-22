const express = require('express')
const app = express();
app.use(express.static('public'));
const router = express.Router();
const mongoose = require('mongoose');
const users = require("./src/user.js");
const challenges = require("./src/challenge.js");
const classes = require("./src/class.js");
const axios = require("axios");
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
  // Run Tests
  console.clear()
  console.log("⏳ Running tests...");
  console.log("👀 Checking /users/register endpoints.");
  axios
  .get('https://api.ctfguide.com/users/register', {
    username : 'laphatize',
  })
  .then(res => {
    console.log(`statusCode: ${res.status}`)
    console.log(res.data)

    console.log("✅ Test Passed.")
    axios
  .get('https://api.ctfguide.com/users/login', {
    dummy: 'd1'
  })
  .then(res => {
    console.log(`statusCode: ${res.status}`)
    console.log(res.data)

    console.log("✅ Test Passed.")
    axios
  .get('https://api.ctfguide.com/users/data', {
    dummy: 'd1'
  })
  .then(res => {
    console.log(`statusCode: ${res.status}`)
    console.log(res.data)

    console.log("✅ Test Passed.")
    axios
  .get('https://api.ctfguide.com/users/createvm', {
    dummy: 'd1'
  })
  .then(res => {
    console.log(`statusCode: ${res.status}`)
    console.log(res.data)

    console.log("✅ Test Passed.")
  })
  .catch(error => {
    console.log("\x1b[1m\x1b[31m", "\n\n❌ Test Failed @ /api/users/createvm*\n\n")
    process.exit(0);
  })
  })
  .catch(error => {
    console.log("\x1b[1m\x1b[31m", "\n\n❌ Test Failed @ /api/users/data*\n\n")
    process.exit(0);
  })
  })
  .catch(error => {
    console.log("\x1b[1m\x1b[31m", "\n\n❌ Test Failed @ /api/users/login*\n\n")
    process.exit(0);
  })
  })
  .catch(error => {
    console.log(error)
    console.log("\x1b[1m\x1b[31m", "\n\n❌ Test Failed @ /users/register\n \n")
    process.exit(0);
  })


  console.log("CTFGuide API is deployed on server port 3001.");
})
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
const orgs = require("./src/orgs.js");
initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
mongoose.connect(secret.mongodb).then(() => {console.log("\n[OK] Connected to MongoDB")} )
.catch(error => console.log(error));

app.use("*", cors())
app.use("/users", users);
app.use("/challenges", challenges);
app.use("/classes", classes);
app.use("/orgs", orgs);

//set public
app.use(express.static('apidoc'));

// main api page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/apidoc/index.html");
});


let UserModel = require('./models/user.js')
let ChallengeModel = require('./models/challenge.js')
function loadingAnimation(
  text = "",
  chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"],
  delay = 100
) {
  let x = 0;

  return setInterval(function() {
      process.stdout.write("\r" + chars[x++] + " " + text);
      x = x % chars.length;
  }, delay);
}
http.listen(3001, () => {
  // Run Tests
  // MongoDB Stuff
  


  console.log("\x1b[92m[OK] Server is running on port 3001");

  loadingAnimation("Running Test: Credential Leak")

});
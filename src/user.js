var express = require('express');
var router = express.Router();
let UserModel = require('../models/user.js')

// Register a new account
router.get("/register", (request, response) => {
    
    // Fetch email using uid.
    if (!request.query.uid) {
        return response.status(400).json({
            "message" : "Malformed Request. Are you missing the user id?"
        })
    }


    let newUser = new UserModel({
      uid: request.query.uid,
      email: "test@gmail.com",
      streak: 0,
      points: 0,
      createdClasses: [],
      history: [],
      classes: []
    })

    
    newUser.save()
      .then(doc => {
        return response.status(200).json({
            "message" : "Account data has been updated."
        })
      })
      .catch(err => {
        console.log(err)
        return response.status(500).json({
            "message" : "Unable to create save data. Please contact support if you keep running into this issue."
        })
    })


})





module.exports = router;

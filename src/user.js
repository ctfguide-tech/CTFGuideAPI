const express = require('express');
const router = express.Router();
let UserModel = require('../models/user.js')
const { getAuth } = require('firebase-admin/auth');
const axios = require("axios")
// Register a new account
router.get("/register", (request, response) => {
    
    // Missing Fields Handling
    if (!request.query.uid) {
        return response.status(400).json({
            "message" : "Malformed Request. Are you missing the user id?"
        })
    }

    getAuth()
        .getUser(request.query.uid)
        .then((userRecord) => {
            let newUser = new UserModel({
                uid: request.query.uid,
                email: userRecord.email,
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


              // Create a user on our terminal.
              
        })
        .catch((error) => {
            switch (error.errorInfo.code) {
                case 'auth/user-not-found' :
                    return response.status(500).json({"message" : "Invalid UID provided."});
                
                default: return response.status(401).json({
                    "message" : "An internal server error has occured."
                })
            }
 
        });

        

    
})

// Fetch user data
router.get("/data", (request, response) => {
    
    // Missing Fields Handling
    if (!request.query.uid) {
        return response.status(400).json({
            "message" : "Malformed Request. Are you missing the user id?"
        })
    }


    getAuth()
        .getUser(request.query.uid)
        .then((userObject) => {
            const uid = request.query.uid
            UserModel.findOne({ uid: uid }, (err, userData) => {
                if (err) {
                    console.log(err);
                    return response.status(401).json({
                        "message" : "An internal server error has occured."
                    })
                }

                if (userData) {
                    return response.status(200).json(userData)
                } else {
                    return response.status(500).json({
                        "message" : "This user needs to be registered with the API via the endpoint /users/register."
                    })
                }
            });
        })
        .catch((error) => {
            switch (error.errorInfo.code) {
                case 'auth/user-not-found' :
                    return response.status(500).json({"message" : "Invalid UID provided."});
                
                default: return response.status(401).json({
                    "message" : "An internal server error has occured.",
                    "dev" : error.errorInfo
                })
            }
    });
})


// Create an account for the user
router.get("/createvm", (request, response) => {
    
    // Missing Fields Handling
    if (!request.query.uid) {
        return response.status(400).json({
            "message" : "Malformed Request. Are you missing the user id?"
        })
    }


    getAuth()
        .getUser(request.query.uid)
        .then((userObject) => {
            const uid = request.query.uid
            const password = Math.random().toString(36).slice(-8);
            UserModel.findOne({ uid: uid }, (err, userData) => {
                UserModel.updateOne({ uid: uid }, {vmPassword : password}, (err, vmResponse) => {
                    if (err) {
                        console.log(err);
                        return response.status(401).json({
                            "message" : "An internal server error has occured."
                        })
                    } else {
    
                        axios
                            .get('https://terminal-gateway.ctfguide.com/createvm?uid=' + uid + '&password=' + password + "&username=" + userData.username)
                            .then(res => {
                                if (res.status == 200) {
                                    return response.status(200).json({
                                        "message" : "Account created successfully.",
                                        "password" : password
                                    })
                                }
                            })
                            .catch(error => {
                                console.log(error)
                                return response.status(500).json({
                                    "message" : "An internal server error has occured."
                                })
                            })
                    }
                });
            });
  
        })
        .catch((error) => {
            console.log(error)
            if (error.errorInfo.code) {
            switch (error.errorInfo.code) {
                case 'auth/user-not-found' :
                    return response.status(500).json({"message" : "Invalid UID provided."});
                
                default: return response.status(401).json({
                    "message" : "An internal server error has occured.",
                    "dev" : error.errorInfo
                })
            }
        }
    });
})


// Fetch Suggested Challenges
router.get("/suggested", (request, response) => {
    
    // Missing Fields Handling
    if (!request.query.uid) {
        return response.status(400).json({
            "message" : "Malformed Request. Are you missing the user id?"
        })
    }


    getAuth()
        .getUser(request.query.uid)
        .then((userObject) => {
            const uid = request.query.uid
            UserModel.findOne({ uid: uid }, (err, userData) => {
                if (err) {
                    console.log(err);
                    return response.status(401).json({
                        "message" : "An internal server error has occured."
                    })
                }

                if (userData) {
                    return response.status(200).json(userData)
                } else {
                    return response.status(500).json({
                        "message" : "This user needs to be registered with the API via the endpoint /users/register."
                    })
                }
            });
        })
        .catch((error) => {
            switch (error.errorInfo.code) {
                case 'auth/user-not-found' :
                    return response.status(500).json({"message" : "Invalid UID provided."});
                
                default: return response.status(401).json({
                    "message" : "An internal server error has occured.",
                    "dev" : error.errorInfo
                })
            }
    });
})



module.exports = router;

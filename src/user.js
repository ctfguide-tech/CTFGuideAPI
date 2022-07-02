const express = require('express');
const router = express.Router();
let UserModel = require('../models/user.js')
const { getAuth } = require('firebase-admin/auth');
const axios = require("axios")

// Check if a username is valid
router.get("/checkusername", (request, response) => {

    console.log("Endpoint hit")
    var username = (request.query.username).toLowerCase();
    var badChar = /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]+/;

    // run the same client side checks again just incase
    if (!username || username.length < 5 || username.length > 15 || badChar.test(username)) {
        console.log(username)
        return response.status(400).json({
            "message" : "Username invalid format."
        })
    } 

    // check if username is already taken
    UserModel.findOne({
        username : username
    }).then(user => {
        
     
  
        if (user) {
            console.log(user)
            return response.status(400).json({
                "message" : "Username already taken."
            })
        }

        return response.status(200).json({
            "message" : "Username available."
        });
    })





})


// Update user progress on a lesson
router.get("/progress", (request, response) => {
        console.log(`[DEBUG] Progress update from ${request.query.uid}`)
        // Missing Fields Handling
        if (!request.query.uid) {
            return response.status(400).json({
                "message" : "Malformed Request. Are you missing the user id?"
            })
        }

        if (!request.query.lessoncode) {
            return response.status(400).json({
                "message" : "Malformed Request. Are you missing the lesson code?"
            })
        }

        getAuth()
        .getUser(request.query.uid)
        .then((userRecord) => {
            UserModel.findOne({uid: request.query.uid})
                .then(doc => {
                    if (!doc.lessonsCompleted) {
                        doc[`lessonsCompleted`] = [];
                    }



                    if (doc.lessonsCompleted.includes(request.query.lessoncode)) {
                     
                        return response.status(200).json({

                            "message" : "You have already completed this lesson."
                        })
                    }
                    doc.lessonsCompleted.push(request.query.lessoncode)

                    doc.save()
                        .then(doc => {
                            return response.status(200).json({
                                "message" : "OK"
                            })
                        })
                        .catch(err => {
                            console.log(err)
                            return response.status(500).json({
                                "message" : "Unable to create save data. Please contact support if you keep running into this issue."
                            })

                        })
                })

           
              
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


});


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
                username: request.query.username,
                streak: 0,
                points: 0,
                createdClasses: [],
                history: [],
                classes: [],
                tutorialComplete: false
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


router.get("/start-lesson", (request, response) => {
    if (!request.query.uid) {
        return response.status(400).json({
            "message" : "Malformed Request. Are you missing the user id?"
        })
    }

    getAuth()
        .getAuth()
        .getUser(request.query.uid)
        .then((userRecord) => {
            UserModel.findOneAndUpdate({uid: request.query.uid}, {$set: {lessonProgress: {}}}, {new: true})
                .then(doc => {
                    return response.status(200).json({
                        "message" : `${request.query.lessonID} Lesson has been started.`
                    })
                })
                .catch(err => {
                    console.log(err)
                    return response.status(500).json({
                        "message" : "Unable to create save data. Please contact support if you keep running into this issue."
                    })
                })
        });
        
});

router.get("/tutorial", (request, response) => {
    
    // Missing Fields Handling
    if (!request.query.uid) {
        return response.status(400).json({
            "message" : "Malformed Request. Are you missing the user id?"
        })
    }

    getAuth()
        .getUser(request.query.uid)
        .then((userRecord) => {
            UserModel.findOne({uid: request.query.uid})
                .then(doc => {
                    doc.tutorialComplete = true
                    doc.save()
                        .then(doc => {
                            return response.status(200).json({
                                "message" : "Tutorial has been completed."
                            })
                        })
                        .catch(err => {
                            console.log(err)
                            return response.status(500).json({
                                "message" : "Unable to create save data. Please contact support if you keep running into this issue."
                            })

                        })
                })

           
              
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

    // Fetch user data from firebase
    getAuth()
        .getUser(request.query.uid)
        .then((userObject) => {
            const uid = request.query.uid
            
            // Fetch user data from our database
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


    // Get user details from firebase.
    getAuth()
        .getUser(request.query.uid)
        .then((userObject) => {
            const uid = request.query.uid
            let password = Math.random().toString(36).slice(-8);
            UserModel.findOne({ uid: uid }, (err, userData) => {
                let username = userData.username
                username = username.toLowerCase();

                // Check if we already have an account for this user.
                if (userData.vmPassword) {
                    return response.status(500).json({
                        "message" : "This user already has an account."
                    })
                }


                // Save VM password to DB.
                UserModel.updateOne({ uid: uid }, {vmPassword : password, vmUsername: username}, (err, vmResponse) => {
                    if (err) {
                        console.log(err);
                        return response.status(401).json({
                            "message" : "An internal server error has occured."
                        })
                    } else {
                        
                        // Ask the terminal server to create an account for the user.
                        axios
                            .get('https://terminal-gateway.ctfguide.com/createvm?uid=' + uid + '&password=' + password + "&username=" + username)
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
            // If we are given a fake UID. 
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

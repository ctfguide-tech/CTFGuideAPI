const express = require('express');
const router = express.Router();
let UserModel = require('../models/user.js')
const { getAuth } = require('firebase-admin/auth');
const secret = require("../private/secret.json")

const axios = require("axios")
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
console.log(secret.mg)
const client = mailgun.client({username: 'api', key: secret.mg});

/**
 * @api {get} /users/checkOTP Check OTP code
 * @apiName checkOTP
 * @apiGroup Users
 * @apiQuery {String} uid
 * @apiQuery {String} code
 * @apiSuccess {String} Response Valid OTP
 * @apiError {String} Response Bad OTP
 */

router.get("/checkOTP", (request, response) => {
    let uid = request.query.uid;
    let otp = request.query.otp;

    UserModel.findOne({uid: uid}, (err, user) => {
        if (err) return;
        if (user.otp == otp) {
            user[`emailVerified`] = true;
            user.save();
            return response.status(200).send("Valid OTP")
        } else {
            return response.status(200).send("Bad OTP");
        }

    });
})


/**
 * @api {get} /users/sendOTP Send OTP code
 * @apiName sendOTP
 * @apiGroup Users
 * @apiQuery {String} uid
 * @apiSuccess {json} Message Email attempted
 */
router.get("/sendOTP", (request, response) => {
    let uid = request.query.uid;
    if (!uid) return response.status(400).send({
        "message" : "No UID provided"
    })

    getAuth()
    .getUser(request.query.uid)
    .then((userRecord) => {
        UserModel.findOne({uid: request.query.uid})
            .then(doc => {
                if (doc) {
                    
                    var userEmail = doc.email;
                    console.log(userEmail   )
                   // let otp = Math.floor(Math.random() * 1000000);
                    let otp = Math.floor(100000 + Math.random() * 900000);

                    // create/store otp in database
                  //  UserModel.findOneAndUpdate({uid: request.query.uid}, {$set: {otp: otp}})
                    doc[`otp`] = otp;


                    
                    doc.save();
                      const messageData = {
                        from: "CTFGuide Verification <verification@mail.ctfguide.com>",
                        to: [userEmail],
                        subject: "CTFGuide Verification Code",
                        text: `Your verification code is: ${otp}`
                      };
                      
                      client.messages.create("mail.ctfguide.com", messageData)
                       .then((res) => {
                         console.log(res);
                       })
                       .catch((err) => {
                         console.error(err);
                       });
                      
                
                
                
                
                
                
                
                
                
                    }





            });
    });

    response.status(200).send({
        "message" : "Email attempted"
    })
   
})

/**
 * @api {get} /users/checkusername Check username to see if its taken
 * @apiName checkusername
 * @apiGroup Users
 * @apiQuery {String} username
 * @apiSuccess {String} Response Username available.
 * @apiError {String} Response Username already taken.
 * @apiError {String} Response Username invalid format.
 */
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



/**
 * @api {get} /users/progress Get user progress for a lesson
 * @apiName progress
 * @apiGroup Users
 * @apiQuery {String} uid User ID
 * @apiQuery {String} lessonID Lesson ID
 * @apiSuccess {String} Response User progress
 * @apiError {String} Malformed Request. Are you missing the user id?
 */
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
    if (!request.query.uid || !request.query.username || !request.query.age || !request.query.country) {
        return response.status(400).json({
            "message" : "Malformed Request. Missing parameters."
        })
    }

    var username = (request.query.username).toLowerCase();
    var badChar = /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]+/;

    // run the same client side checks again just incase
    if (!username || username.length < 5 || username.length > 15 || badChar.test(username)) {
        console.log(username)
        return response.status(400).json({
            "message" : "Username invalid format."
        })
    } 

    UserModel.findOne({
        uid : request.query.uid
    }).then(user => {
        
     
  
        if (user) {
            if (!user.username) {
                UserModel.findOne({uid: request.query.uid})
                .then(doc => {
                    doc.username = request.query.username
                    doc.save()
                        .then(doc => {
                            return response.status(200).json({
                            })
                        })
                        .catch(err => {
                            console.log(err)
                          

                        })
                })

            }
            return response.status(200).json({
                "message" : "Already done"
            });
        }  else {

    // check if username is already taken
    UserModel.findOne({
        username : username
    }).then(user => {
        
     
  
        if (user) {
            return response.status(400).json({
                "message" : "Username taken."
            });
        }

        
    })



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
                age: request.query.age,
                country: request.query.country,
                history: [],
                classes: [],
                tutorialComplete: false,
                emailVerified: false
              })
          
              newUser.save()
                .then(doc => {
                  return response.status(200).json({
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

        

    
        }

        
    })

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

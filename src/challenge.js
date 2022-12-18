const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hookKeyFile = require("../private/secret.json");
const hook = new Webhook(hookKeyFile.webook_url);
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({
    extended: true
})
router.use(bodyParser.json());
const secret = require("../private/secret.json")

let challengeModel = require("../models/challenge.js");
let solutionModel = require("../models/solution.js");
let userModel = require("../models/user.js");


const axios = require("axios")
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const user = require('../models/user.js');
const mailgun = new Mailgun(formData);
console.log(secret.mg)
const client = mailgun.client({username: 'api', key: secret.mg});

// verify a challenge
router.get('/verify', urlencodedParser, async (request, response) => {

   
    let challenge = await challengeModel.findOne({
        id: request.query.id,
        uid: request.query.uid
    });


    // get username
    let user = await userModel.findOne({
        uid: request.query.uid
    });
    let username = user.username;

    if (username == "laphatize" || username == "herronjo") {

        challenge.verified = true;
        await challenge.save();

        const messageData = {
            from: "CTFGuide <noreply@mail.ctfguide.com>",
            to: user.email,
            subject: "Congrats! Your challenge is verified.",
            text: `Hello, ${username}! We're happy to let you know that your challenge, "${challenge.title}" is verified and can now be seen by others on CTFGuide. We appreciate your contribution to CTFGuide!`
          };
          
          client.messages.create("mail.ctfguide.com", messageData)
           .then((res) => {
             console.log(res);
           })
           .catch((err) => {
             console.error(err);
           });

        response.send("success");

    } else {
        response.send("fail");
    }


    var params = {
      
        embeds: [
            {
                "title": "✅ Challenge Verified",
                "color": 15258703,

                "description" : `Name: ${challenge.title}\nDescription: ${challenge.problem}\nCategory: ${challenge.category}\nDifficulty: ${challenge.difficulty}\nLink: https://ctfguide.com/challenges/${request.query.id}\n\nVerified by: ${username}`,
            }
        ]
    }

    fetch(secret.d1, {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(res => {
        console.log(res);
    }) 
    
})

   
// Create a challenge
router.post("/create-challenge", urlencodedParser, async (request, response) => {
    console.log("endpoint hit")
    if (!request.body.title || !request.body.description || !request.body.solution || !request.body.difficulty || !request.body.category || !request.body.hint1 || !request.body.hint2 || !request.body.hint3) {
        response.status(400).json({
            message: "Please fill out all fields"
        });
        return;
    }

    let points = 0;
    
    if (request.body.difficulty == "easy") {
        points = 100;
    } else if (request.body.difficulty == "medium") {
        points = 200;
    } else if (request.body.difficulty == "hard") {
        points = 300;
    } else {
        return response.status(400).json({
            message: "Please select a valid difficulty"
        });
    }


    // fetch the author provided to user id
    let authorData = await userModel.findOne({
        uid: request.body.uid
    });

    let verifiedStatus = false;

    if (authorData.username == "laphatize" || authorData.username == "herronjo") {
        verifiedStatus = true;
    }

    

    // generate a random id
    let id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


    authorData.createdChallenges.push(id);
    await authorData.save();

    let challenge = new challengeModel({
        id: id,
        title: request.body.title,
        problem: request.body.description,
        category: request.body.category,
        difficulty: request.body.difficulty,
        points: points,
        hint1: request.body.hint1,
        hint2: request.body.hint2,
        hint3: request.body.hint3,
        safeName: authorData.username,
        verified: verifiedStatus,
        views: 0,
        attempts: 0,
        goodAttempts: 0
    });


    var params = {
        content: "@here",
        embeds: [
            {
                "title": "📝 New Challenge",
                "color": 15258703,

                "description" : `Name: ${challenge.title}\nDescription: ${challenge.problem}\nCategory: ${challenge.category}\nDifficulty: ${challenge.difficulty}\nLink: https://ctfguide.com/challenges/${challenge.id}\n\n`,
            }
        ]
    }

    fetch(secret.d2, {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(res => {
        console.log(res);
    }) 



    challenge.save((error) => {
        if (error) {
            console.log(error);
            response.status(500).json({
                message: "Error creating challenge"
            });
        } else {
            response.status(200).json({
                message: "Challenge created"
            });
        }
    }

    );
 
    // hash solution with bcrypt
    let salt = await bcrypt.genSalt(10);
    let hashedSolution = await bcrypt.hash(request.body.solution, salt);
    

    // store solution
    let solution = new solutionModel({
        id: id,
        solution: hashedSolution
    });

    await solution.save();
});


// Post a comment
router.get("/comments/post", async (request, response) => {

    console.log("The comment " + request.query.comment + " was posted by " + request.query.uid + ".");
    
    if (!request.query.challengeID) return response.status(400).json({
        "message": "Please provide the challenge ID."
    })
    
    if (!request.query.comment) {
        return response.status(400).json({
            "message": "Please provide a comment."
        })
    }

    if (request.query.comment.length > 250 || request.query.comment.length < 5) {
        return response.status(400).json({
            "message": "Comment can't be posted."
        })
    }

    let username = await userModel.findOne({uid: request.query.uid });

    challengeModel.findOne({id: request.query.challengeID}, (err, challenge) => {
        let newCommentID = Math.floor(Math.random() * 1000000)
        if (err) {
            console.log(err);
        } else {
            if (challenge) {
            
                let comment = {
                    comment: request.query.comment,
                    username: username.username,
                    date: new Date(),
                    id: newCommentID
                }

                if (!challenge.comments) {
                    challenge.comments = [];
                }

                challenge.comments.push(comment);
                console.log(challenge.comments)

             

                // save challenge and then
                challenge.save((err, challenge) => {
                    if (err) console.log(err);
                    userModel.findOne({uid: request.query.uid}, (err, user) => {
                        if (err) {
                            console.log(err);
                        }
    
                        if (!user.comments) {
                            user.comments = [];
                        }
    
                        user.comments.push(newCommentID)
    
                        user.save();
    
                        response.status(200).json({
                            "message": "Comment posted."
                        })
                    })
                })

           


              
            } else {
                response.status(404).json({
                    "message": "Challenge not found."
                })
            }
        }
    });



});



// Fetch Challenge by difficulty
router.get("/type/:difficulty", (request, response) => {

    // handle invalid difficulty
    if (request.params.difficulty !== "easy" && request.params.difficulty !== "medium" && request.params.difficulty !== "hard" && request.params.difficulty !== "all") {
        return response.status(400).json({
            "message": "Invalid difficulty. Please use 'easy', 'medium' or 'hard'."
        })
    }

    if (request.params.difficulty === "all") {
        challengeModel.find({}, (err, challengeData) => {
            if (!challengeData) return response.status(400).json({
                "message": "Hmm, it seems like there are no challenges stored in our database."
            })
            return response.status(200).json(challengeData);
        })
    } else {

        challengeModel.find({ difficulty: request.params.difficulty }, (err, challengeData) => {
            if (!challengeData) return response.status(400).json({
                "message": "Hmm, it seems like there are no challenges stored in our database."
            })
            return response.status(200).json(challengeData);

        })

    }

});

// Fetch challenge hint

/*
router.get("/hint/:challengeID", (request, response) => {

    if (!request.params.challengeID) return response.status(400).json({
        "message": "Please provide the challenge ID."
    })

    challengeModel.findOne({ id: request.params.challengeID }, (err, challenge) => {
        if (err) {
            console.log(err);
        } else {
            if (challenge) {
                return response.status(200).json({
                    "message": challenge.hints
                })
            } else {
                return response.status(404).json({
                    "message": "Challenge not found."
                })

            }
        }
    })
});
*/

// update challenge
router.post("/update/:challengeID" , urlencodedParser,  (request, response) => {
   
    if (!request.params.challengeID) return response.status(400).json({
        "message": "Please provide the challenge ID."
    })

    // check if user owns challenge
    userModel.findOne({ uid: request.body.uid }, (err, userData) => {


        if (userData.createdChallenges.includes(request.params.challengeID)) {
                // find challenge given id and update with information provided
                challengeModel.findOne({ id: request.params.challengeID }, (err, challenge) => {
                    // update challenge with info
                    console.log(challenge.title)
                    challenge.title = request.body.title;
                    challenge.problem  = request.body.problem;
                    challenge.hint1 = request.body.hint1
                    challenge.hint2 = request.body.hint2
                    challenge.hint3 = request.body.hint3



                    // save challenge
                    challenge.save((err, challenge) => {
                        if (err) console.log(err);
                        return response.status(200).json({
                            "message": "OK"
                        })
                    });
                });

        } else {
            return response.status(400).json({
                "message": "You don't own this challenge."
            })
        }
    
    });

 
});


// Fetches a specific challenge using the id
router.get("/specific/:id", (request, response) => {
    if (!request.params.id) return response.status(400).json({
        "message": "Please provide the challenge ID."
    })

    // log to user history
    //console.log("Saved " + request.params.id + ` to user ${request.query.uid} history.`);

    if (request.query.uid) {
        userModel.findOneAndUpdate({ uid: request.query.uid }, { $push: { history: request.params.id } }, (err, userData2) => {

            //  console.log(userData2);

            if (err) {
                console.log(err);
                return response.status(401).json({
                    "message": "An internal server error has occured."
                })
            }

            if (!userData2) return response.status(400).json({

                "message": "Hmm, it seems like there are no challenges stored in our database."
            })


            challengeModel.find({ id: request.params.id }, (err, challengeData) => {
                if (challengeData.length === 0) return response.status(404).json({
                    "message": "You're looking for a challenge that doesn't exist."
                })
                return response.status(200).json(challengeData[0]);
            })

        });

    } else {
        challengeModel.find({ id: request.params.id }, (err, challengeData) => {
            if (challengeData.length === 0) return response.status(404).json({
                "message": "You're looking for a challenge that doesn't exist."
            })
            return response.status(200).json(challengeData[0]);
        })
    }


});


// Fetches leaderboards for a given challenge
router.get("/leaderboards/:id", (request, response) => {
    if (!request.params.id) return response.status(400).json({
        "message": "Please provide the challenge ID."
    })

    if (request.params.id === "global") {
        // We don't actually collect country data so for now we'll just keep it for USA
        userModel.find({}).sort([['points', -1]]).exec(function (err, model) {
            let data = model;
            var safeData = [];
            for (var i = 0; i < data.length; i++) {
                var myCountry = "Unknown"
                if (data[i].username == "laphatize") {
                    console.log(data[i].country)
                }
                if (data[i].country) {
                    myCountry = data[i].country;
                }

                if (data[i].username) {
                    safeData.push({
                        "pos": "#" + (i + 1),
                        "username": data[i].username,
                        "points": data[i].points,
                        "country": myCountry
                    })
                }
           
            }

            return response.status(200).json(safeData);
        });
    }


    /*
        challengeModel.find({id : request.params.id}, (err, challengeData) => {
            if (challengeData.length === 0) return response.status(404).json({
                "message" : "You're looking for a challenge that doesn't exist."
            })
            return response.status(200).json(challengeData[0]);
        })
        */

});



// Checks challenges
router.get("/check/:id", (request, response) => {
    if (!request.params.id) return response.status(400).json({
        "message": "Please provide the challenge ID."
    })

    solutionModel.find({ id: request.params.id }, (err, solutionData) => {

        if (solutionData.length === 0) return response.status(404).json({
            "message": "You're attempting to check a challenge that doesn't exist."
        })

        // Fetch Solved Challenges by user
        userModel.find({ uid: request.query.uid }, (err, userData) => {
            if (userData.length === 0) return response.status(404).json({
                "message": "You're attempting to check a challenge that doesn't exist."
            })



            bcrypt.compare(request.query.flag, solutionData[0].solution, (err, result) => {
                if (result) {
                    // add challenge to solved challenges
                    
                    if (userData.solvedChallenges) {
                    if (userData[0].solvedChallenges.includes(request.params.id)) {
                        console.log("already s")
                        return response.status(200).json({
                            "message": "OK",
                            "award": 0
                        })
                    } 
                }

                        if (!userData[0].solvedChallenges) {
                            userData[0].solvedChallenges = [`${request.params.id}`];
                            challengeModel.findOneAndUpdate({ id: request.params.id }, { solvedChallenges : userData[0].solvedChallenges }, (err, challengeData) => {
                                
                                let points = challengeData.points;
                                let newDate = new Date();
                                let streakAmount = 0;

                                if (userData[0].streak) {
                                    streakAmount = userData[0].streak;
                                }
                                let streakChange = false;
                                // handle streaks
                                if (userData[0].lastSolvedDate) {
                                    let lastSolvedDate = new Date(userData[0].lastSolvedDate);
                                    let diff = newDate - lastSolvedDate;
                                    let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    if (diffDays === 1) {
                                        streakAmount++;
                                        streakChange = true;
                                    } else {
                                        streakChange = true;
                                        streakAmount = 1;
                                    }

                                } else {
                                    streakChange = true;
                                    streakAmount = 1;
                                }

                                userModel.findOneAndUpdate({ uid: request.query.uid}, { $inc: { points: points }, lastSolvedDate: newDate, streak: streakAmount }, (err, userData) => {


                                    return response.status(200).json({
                                        "message": "OK",
                                        "award": points,
                                        "streakchange" : streakChange
                                    })

                                });

                                
                           
                            });
                             
                        } else {
                        userModel.findOneAndUpdate({ uid: request.query.uid }, { $push: { solvedChallenges: request.params.id } }, (err, userData2) => {
                          //  console.log(userData2)
                            if (err) {
                                //     console.log(err);
                                return response.status(401).json({
                                    "message": "An internal server error has occured."
                                })
                            } else {
                                // fetch points
                                challengeModel.findOneAndUpdate({ id: request.params.id }, { $push: { leaderboards: userData2.username } }, (err, challengeData) => {

                                      
                                let points = challengeData.points;
                                let newDate = new Date();
                                let streakAmount = 0;

                                if (userData2.streak) {
                                    streakAmount = userData2.streak;
                                }


                                let streakChange = false;
                                // handle streaks
                                if (userData2.lastSolvedDate) {
                                    let lastSolvedDate = new Date(userData2.lastSolvedDate);
                                    let diff = newDate - lastSolvedDate;
                                    let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    console.log(diffDays)
                                    if (diffDays === 1) {
                                        streakAmount++;
                                        streakChange = true;
                                    } else {
                                        streakChange = true;
                                        streakAmount = 1;
                                    }

                                } else {
                                    streakAmount = 1;
                                    streakChange = true;
                                }
                                
                                userModel.findOneAndUpdate({ uid: request.query.uid}, { $inc: { points: points }, lastSolvedDate: newDate, streak: streakAmount}, (err, userData) => {
                                    if (err) {
                                        console.log(err)
                                    }

                                    return response.status(200).json({
                                        "message": "OK",
                                        "award": points,
                                        "streakchange" : streakChange
                                    })


                                    });
                                });
                            }
                        });
                    }

                    
                


                } else {


                    userModel.find({ uid: request.query.uid }, (err, userData) => {
                        const embed = new MessageBuilder()
                            .setTitle('❌ Challenge Failure')
                            .setColor('#00b0f4')
                            .setDescription(`**Challenge ID:** ${request.params.id}\n\n**Solution:** ${request.query.flag}\n\n**Expected:** ${solutionData[0].solution}\n\n**User:** ${userData[0].username}\n\n__**Possible Actions**__\n [Warn for cheating](https://admin.ctfguide.com/${request.query.uid}/warn) | [VPN Block + Ban](https://admin.ctfguide.com) `)
                            .setTimestamp();

                        hook.send(embed);

                        return response.status(200).json({
                            "message": "BAD"
                        })
                    });




                }
            });

        });



    })


});



module.exports = router;

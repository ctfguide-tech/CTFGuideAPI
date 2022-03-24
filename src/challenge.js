const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hookKeyFile = require("../private/secret.json");
const hook = new Webhook(hookKeyFile.webook_url);

let challengeModel = require("../models/challenge.js");
let solutionModel = require("../models/solution.js");
let userModel = require("../models/user.js");


// Post a comment
router.get("/comments/post", (request, response) => {

    console.log("[NEW COMMENT] " + request.query.comment);
    if (!request.params.id) return response.status(400).json({
        "message" : "Please provide the challenge ID."
    })


    let newComment = {
        "comment" : request.query.comment,
        "user" : request.query.user,
    }


    challengeModel.find({}, (err, challengeData) => {
        

        if (!challengeData) return response.status(400).json({
            "message" : "Hmm, it seems like there are no challenges stored in our database."
        })

        let challenge = challengeData.find(challenge => challenge.id == request.query.id)

        challenge.push(newComment)


        challengeModel.updateOne({ cid: challenge.id }, { challenge }, (err, vmResponse) => {

            if (err) {
                console.log(err);
                return response.status(401).json({
                    "message" : "An internal server error has occured."
                })
            }


            




        });
    


});
});



// Fetch Challenge by difficulty
router.get("/type/:difficulty", (request, response) => {

    // handle invalid difficulty
    if (request.params.difficulty !== "easy" && request.params.difficulty !== "medium" && request.params.difficulty !== "hard" && request.params.difficulty !== "all") {
        return response.status(400).json({
            "message" : "Invalid difficulty. Please use 'easy', 'medium' or 'hard'."
        })
    }

    if (request.params.difficulty === "all") {
        challengeModel.find({}, (err, challengeData) => {
            if (!challengeData) return response.status(400).json({
                "message" : "Hmm, it seems like there are no challenges stored in our database."
            })
            return response.status(200).json(challengeData);
        })
    } else {

    challengeModel.find({difficulty: request.params.difficulty}, (err, challengeData) => {
        if (!challengeData) return response.status(400).json({
            "message" : "Hmm, it seems like there are no challenges stored in our database."
        })
        return response.status(200).json(challengeData);

    })

    }

});



// Fetches a specific challenge using the id
router.get("/specific/:id", (request, response) => {
    if (!request.params.id) return response.status(400).json({
        "message" : "Please provide the challenge ID."
    })
    challengeModel.find({id : request.params.id}, (err, challengeData) => {
        if (challengeData.length === 0) return response.status(404).json({
            "message" : "You're looking for a challenge that doesn't exist."
        })
        return response.status(200).json(challengeData[0]);
    })
});


// Fetches leaderboards for a given challenge
router.get("/leaderboards/:id", (request, response) => {
    if (!request.params.id) return response.status(400).json({
        "message" : "Please provide the challenge ID."
    })

    if (request.params.id === "global") {
        // We don't actually collect country data so for now we'll just keep it for USA
        userModel.find({}).sort([['points', -1]]).exec(function(err, model){
            let data = model;
            var safeData = [];
            for (var i = 0; i < 20; i++) {
                var myCountry = "Unknown"
                if (data[i].username == "laphatize") {
                    console.log(data[i].country)
                }
                if (data[i].country) {
                    myCountry = data[i].country;
                }
                safeData.push({
                    'points' : data[i].points,
                    'username': data[i].username,
                    'country' : myCountry,
                    'pro' : data[i].pro
                })
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
        "message" : "Please provide the challenge ID."
    })
    
    solutionModel.find({id : request.params.id}, (err, solutionData) => {

        if (solutionData.length === 0) return response.status(404).json({
            "message" : "You're attempting to check a challenge that doesn't exist."
        })       
        

        bcrypt.compare(request.query.flag, solutionData[0].solution, (err, result) => {
            if (result) {
                return response.status(200).json({
                    "message" : "OK"
                })
            } else {

                
                userModel.find({uid : request.query.uid}, (err, userData) => {
                    const embed = new MessageBuilder()
                    .setTitle('❌ Challenge Failure')
                    .setColor('#00b0f4')
                    .setDescription(`**Challenge ID:** ${request.params.id}\n\n**Solution:** ${request.query.flag}\n\n**Expected:** ${solutionData[0].solution}\n\n**User:** ${userData[0].username}\n\n__**Possible Actions**__\n [Warn for cheating](https://admin.ctfguide.com/${request.query.uid}/warn) | [VPN Block + Ban](https://admin.ctfguide.com) `)
                    .setTimestamp();
                
                    hook.send(embed);

                    return response.status(200).json({
                        "message" : "BAD"
                    })
                });

               


            }
        });
    })


});



module.exports = router;

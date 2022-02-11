const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hookKeyFile = require("../private/secret.json");
const hook = new Webhook(hookKeyFile.webook_url);

let challengeModel = require("../models/challenge.js");
let solutionModel = require("../models/solution.js");
let userModel = require("../models/user.js");




// Fetch Challenges
router.get("/all", (request, response) => {
    challengeModel.find({}, (err, challengeData) => {
        if (!challengeData) return response.status(400).json({
            "message" : "Hmm, it seems like there are no challenges stored in our database."
        })
        return response.status(200).json(challengeData);
    })
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



// Fetches credentials for CTFGuide Server
router.get("/server/credentials", (request, response) => {
    if (!request.query.uid) return response.status(400).json({
        "message" : "Please provide the challenge ID."
    })

    getAuth()
    .getUser(request.query.uid)
    .then((userRecord) => {
        if (!userRecord) return response.json({
            "message" : "You are trying to make server credentials for a user who doesn't exist."
        })
    });

    
    challengeModel.find({id : request.params.id}, (err, challengeData) => {
        if (challengeData.length === 0) return response.status(404).json({
            "message" : "You're looking for a challenge that doesn't exist."
        })

        


        return response.status(200).json(challengeData[0]);
    })
});


module.exports = router;

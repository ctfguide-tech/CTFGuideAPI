const express = require('express');
const router = express.Router();
let challengeModel = require("../models/challenge.js");

// Fetch Challenges
router.get("/all", (request, response) => {
    challengeModel.find({}, (err, challengeData) => {
        if (!challengeData) return response.status(400).json({
            "message" : "Hmm, it seems like there are no challenges stored in our database."
        })
        return response.status(200).json(challengeData);
    })
});


router.get("/specific/:id", (request, response) => {
    if (!request.params.id) return response.status(400).json({
        "message" : "Please provide the challenge ID."
    })
    challengeModel.find({id : request.params.id}, (err, challengeData) => {
        if (challengeData.length === 0) return response.status(404).json({
            "message" : "You're looking for a challenge that doesn't exist."
        })
        return response.status(200).json(challengeData);
    })
});

module.exports = router;

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

module.exports = router;

const express = require('express');

const router = express.Router();

const db = require('../config/connection');
const games = db.get('games');



router.get('/getlastrecords', (req, res) => {
    games.find({}, {limit: 20, sort: {_id: -1}})
        .then(game_collection => {
            res.json(game_collection);
        });
});

module.exports = router;
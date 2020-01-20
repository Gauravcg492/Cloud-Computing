// dependencies
const express = require('express');
const User = require('../models/user');

// variables
const router = express.Router();

// 8. Write to db
router.post('/write', (req,res,next) => {
    console.log('db/write called');
    res.status(200).json({});
});

// 9. Read from db
router.post('/read', (req,res,next) => {
    console.log('db/read called');
    res.status(200).json({})
});

//
module.exports = router;
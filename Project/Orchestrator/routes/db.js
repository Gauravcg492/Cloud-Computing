// dependencies
const express = require('express');
const write = require('../controllers/write.js');
const read = require('../controllers/read');

// variables
const router = express.Router();

// 8. Write to db
router.post('/write', write.writeToQueue);

// 9. Read from db
router.post('/read', read.writeToQueue);

router.post('/clear',async (req,res,next) => {
    console.log("Clearing db");
    // TODO send to writeQ
});

router.use((req,res,next) => {
    res.status(405).json({});
});

//
module.exports = router;

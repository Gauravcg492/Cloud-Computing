// dependencies
const express = require('express');
const rabbitmq = require('../controllers/rabbitmq.js');

// variables
const router = express.Router();

// 8. Write to db
router.post('/write', rabbitmq.sendToWriteQ);

// 9. Read from db
router.post('/read', rabbitmq.sendToReadQ);

router.post('/clear',async (req,res,next) => {
    console.log("Clearing db");
    // TODO send to writeQ
});

router.use((req,res,next) => {
    res.status(405).json({});
});

//
module.exports = router;

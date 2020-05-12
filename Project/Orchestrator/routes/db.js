// dependencies
const express = require('express');
const rabbitmq = require('../controllers/rabbitmq.js');
const containers = require('../middlewares/containers');

// variables
const router = express.Router();

// 8. Write to db
router.post('/write', rabbitmq.sendToWriteQ);

// 9. Read from db
router.post('/read', containers.updateCount, rabbitmq.sendToReadQ);

router.post('/clear', (req,res,next) => {
    console.log("Clearing db");
    // TODO send to writeQ
    req.body.action = 0;
    next();
}, rabbitmq.sendToWriteQ);

router.use((req,res,next) => {
    res.status(405).json({});
});

//
module.exports = router;

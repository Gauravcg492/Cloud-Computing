// dependencies
const express = require('express');

// variables
const router = express.Router();

// 8. Write to db
router.post('/write', async (req, res, next) => {
    // TODO send to writeQ
});

// 9. Read from db
router.post('/read', async (req, res, next) => {
    // TODO send to readQ 
});

router.use((req,res,next) => {
    res.status(405).json({});
});

//
module.exports = router;

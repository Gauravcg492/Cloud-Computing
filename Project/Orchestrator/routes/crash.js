const express = require('express');

const router = express.Router();

router.post('/master', (req,res,next) => {
    // TODO destroy master
});

router.post('/slave', (req,res,next) => {
    // TODO destroy slave with highest pid
});

router.use((req,res,next) => {
    res.status(405).json({});
});

module.exports = router;
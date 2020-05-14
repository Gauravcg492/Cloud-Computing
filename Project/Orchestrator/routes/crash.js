// dependencies
const express = require('express');
const containers = require('../middlewares/containers');
const fs = require('fs');
require('dotenv/config');

// variables
const router = express.Router();
const path = process.env.DPATH;

// crash api routes
router.post('/master', async (req,res,next) => {
    try {
        let constants = await JSON.parse(fs.readFileSync(path));
        containers.deleteContainer(constants.masterWorker, 'kill');
        pid = constants.masterPid;
        res.status(200).json([pid])
    } catch(err) {
        console.log(err);
        res.status(500).json();
    }    
});

router.post('/slave', async (req,res,next) => {
    try {
        let pid = await containers.deleteSlaveContainers('kill');
        res.status(200).json([pid]);
    } catch(err) {
        console.log(err);
        res.status(500).json();
    }   
});

router.use((req,res,next) => {
    res.status(405).json({});
});

module.exports = router;
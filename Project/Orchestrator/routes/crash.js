const express = require('express');
const containers = require('../middlewares/containers');
const fs = require('fs');
require('dotenv/config');

const router = express.Router();
const path = process.env.DPATH;

router.post('/master', async (req,res,next) => {
    // TODO destroy master
    try {
        let constants = await JSON.parse(fs.readFileSync(path));
        containers.deleteContainer(constants.masterWorker, 'kill');
        pid = constants.masterPid;
        // probably need to change it to string
        res.status(200).json([pid])
    } catch(err) {
        console.log(err);
        res.status(500).json();
    }    
});

router.post('/slave', async (req,res,next) => {
    // TODO destroy slave with highest pid
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
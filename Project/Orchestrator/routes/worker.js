const express = require('express');
const containers = require('../middlewares/containers');

const router = express.Router();

router.get('/list', (req,res,next) => {
    // TODO send list of all containers
    let pids = containers.getWorkerPids();
    console.log("received pids");
    pids.sort();
    res.status(200).json(pids);
});

module.exports = router;
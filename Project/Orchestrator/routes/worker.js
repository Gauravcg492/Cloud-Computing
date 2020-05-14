// dependencies
const express = require('express');
const containers = require('../middlewares/containers');
// router variable
const router = express.Router();

// get list router
router.get('/list', (req,res,next) => {
    // TODO send list of all containers
    let pids = containers.getWorkerPids();
    console.log("received pids");
    pids.sort();
    res.status(200).json(pids);
});

module.exports = router;
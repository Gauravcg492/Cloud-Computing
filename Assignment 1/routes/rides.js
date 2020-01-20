// dependencies
const express = require('express');

//variables
const router = express.Router();

// setting routes
// 3. Create new ride
router.post('/',(req,res,next) => {
    // getting the request body
    const username = req.body.created_by;
    const timeStamp = req.body.timestamp;
    const source = req.body.source;
    const destination = req.body.destination;

    // TODO validate

    // create object
    const ride = {
        username : username,
        timeStamp : timeStamp,
        source : source,
        destination : destination
    }
    res.status(201).json({
        rideDetails : ride
    });
});

// 4. List all upcoming rides for given source and destination
router.get('/', (req,res,next) => {
    res.status(204).json([]);
});

// 5. List all details for given ride
router.get('/:rideID', (req,res,next) => {
    res.status(204).json({});
});

// 6. Join existing ride
router.post('/:rideID', (req,res,next) => {
    // get request body
    const username = req.body.username;

    const ride = {
        username : username
    }
    // change 200 to 204
    res.status(200).json({
        rideToJoin : ride
    });
});

// 7. Delete a ride
router.delete('/:rideID', (req,res,next) => {
    res.status(200).json({});
});


router.delete('/:username',(req,res,next) => {
    res.status(200).json({
        message : 'delete user',
        name : req.params.username
    });
});



// export the router
module.exports = router


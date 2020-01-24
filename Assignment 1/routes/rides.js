// dependencies
const express = require('express');
const request = require('request-promise');

//variables
const router = express.Router();

// setting routes
// 3. Create new ride
router.post('/', async (req, res, next) => {
    // getting the request body
    const username = req.body.created_by;
    const timeStamp = req.body.timestamp;
    const source = Number(req.body.source);
    const destination = Number(req.body.destination);
    if(source < 1 || source > 198 || destination < 1 || destination > 198)
    {
        res.status(400).json({});
        return;
    }

    // TODO validate
    var body = {
        table: 'user',
        where: {
            username: username
        }
    };

    var options = {
        url: 'http://localhost:80/v1/db/read',
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try{
        console.log('Checking for user detail');
        var response = await request.post(options);
    } catch(err){
        console.log('Inside rides.js');
        console.log(err);
        const error = new Error("400 Bad Request");
        error.status = 400;
        next(error);
        return;
    }

    body = {
        action : 1,
        table : "ride",
        values : [username,timeStamp,source,destination]
    };
    options = {
        url: 'http://localhost:80/v1/db/write',
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try{
        console.log('Writing ride details');
        var response = await request.post(options);
        console.log('Write complete');
        console.log(response);
        response = JSON.parse(response);
        const statusCode = response.statusCode;
        console.log('sending response');  
        res.status(statusCode).json({}); 
    } catch{
        const error = new Error("500 Server error");
        error.status = 400;
        next(error);
    }
});

// 4. List all upcoming rides for given source and destination
router.get('/', (req, res, next) => {
    res.status(204).json([]);
});

// 5. List all details for given ride
router.get('/:rideID', (req, res, next) => {
    res.status(204).json({});
});

// 6. Join existing ride
router.post('/:rideID', (req, res, next) => {
    // get request body
    const username = req.body.username;

    const ride = {
        username: username
    }
    // change 200 to 204
    res.status(200).json({
        rideToJoin: ride
    });
});

// 7. Delete a ride
router.delete('/:rideID', (req, res, next) => {
    res.status(200).json({});
});


router.delete('/:username', (req, res, next) => {
    res.status(200).json({
        message: 'delete user',
        name: req.params.username
    });
});



// export the router
module.exports = router


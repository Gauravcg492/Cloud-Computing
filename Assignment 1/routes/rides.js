// dependencies
const express = require('express');
const request = require('request-promise');
const areas = require("../constants");
const helper = require("../helper");

//variables
const router = express.Router();


// setting routes
// 3. Create new ride
router.post('/', async (req, res, next) => {
    // getting the request body
    const username = req.body.created_by;
    const timeStamp = helper.extractDate(req.body.timestamp);
    const source = Number(req.body.source);
    const destination = Number(req.body.destination);
    if (areas[source] == undefined || areas[destination] == undefined || areas[source] == areas[destination] || helper.isInvalid(timeStamp)) {
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
        url: 'http://localhost:80/api/v1/db/read',
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        console.log('Checking for user detail');
        var response = await request.post(options);
    } catch (err) {
        console.log('Inside rides.js');
        console.log(err);
        res.status(400).json({});
        return;
    }

    body = {
        action: 1,
        table: "ride",
        values: [username, timeStamp, source, destination, []]
    };
    options = {
        url: 'http://localhost:80/api/v1/db/write',
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try {
        console.log('Writing ride details');
        var response = await request.post(options);
        console.log('Write complete');
        console.log(response);
        response = JSON.parse(response);
        const statusCode = response.statusCode;
        console.log('sending response');
        res.status(statusCode).json({});
    } catch{
        res.status(400).json({});
    }
});

// 4. List all upcoming rides for given source and destination
router.get('/', async (req, res, next) => {
    console.log('Get called');
    const source = Number(req.query.source);
    const destination = Number(req.query.destination);
    const currentDate = new Date();
    if (areas[source] == undefined || areas[destination] == undefined || areas[source] == areas[destination]) {
        res.status(400).json({});
        return;
    }
    const body = {
        action : 4,
        table: 'ride',
        where: {
            source: source,
            destination: destination,
            validUntil : {
                '$gte' : currentDate
            }
        }
    };
    const options = {
        url: 'http://localhost:80/api/v1/db/read',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try {
        var response = await request.post(options);
        response = JSON.parse(response);
        console.log('Inside get ride');
        console.log(response);
        if (response.length != 0) {
            response = helper.formatResponse(response);
            res.status(200).json(response);
        } else {
            res.status(400).json({});
        }

    } catch (err) {
        console.log(err);
        res.status(400).json({});
    }
});

// 5. List all details for given ride
router.get('/:rideId', async (req, res, next) => {
    const rideId = req.params.rideId;
    var body = {
        action : 5,
        table: 'ride',
        where: {
            rideId: rideId
        }
    };
    var options = {
        url: 'http://localhost:80/api/v1/db/read',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try{
        var response = await request.post(options);
        response = JSON.parse(response);
        if(Object.keys(response).length == 0){
            res.status(400).json({});
        } else{
            console.log(response.timestamp);
            response.timestamp = helper.formatDate(response.timestamp);
            res.status(200).json(response);
        }
    } catch(err){
        console.log(err);
        res.status(400).json({});
    }

});

// 6. Join existing ride
router.post('/:rideId', async (req, res, next) => {
    // get request body
    const username = req.body.username;
    const rideId = req.params.rideId;

    var body = {
        action : 4,
        table : 'ride',
        where : {
            rideId : rideId,
            validUntil : {
                '$gte' : currentDate
            }
        }
    };
    var options = {
        url : 'http://localhost:80/api/v1/db/read',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    try{
        var response = await request.post(options);
        response = JSON.parse(response);
        if(response.length == 0){
            res.status(400).json({});
            return;
        }
        body = {
            table : 'user',
            where : {
                username : username
            }
        };
        options.body = JSON.stringify(body);
        response = await request.post(options);
        response = JSON.parse(response);
        const statusCode = response.statusCode;
        if(statusCode != 200){
            res.status(400).json({});
            return;
        }
    } catch(err){
        console.log(err);
        res.status(400).json({});
    }

    body = {
        action : 6,
        table : 'ride',
        users : username,
        where : {
            rideId : rideId
        }
    };
    options.url = 'http://localhost:80/api/v1/db/write';
    options.body = JSON.stringify(body);

    try{
        var response = await request.post(options);
        response = JSON.parse(response);
        const statusCode = response.statusCode;
        res.status(statusCode).json({});

    } catch(err){
        console.log(err);
        res.status(400).json({});
    }

});

// 7. Delete a ride
router.delete('/:rideId', async (req, res, next) => {
    const rideId = req.params.rideId;

    var body = {
        table: 'ride',
        action : 2,
        where: {
            rideId: rideId
        }
    };
    var options = {
        url: 'http://localhost:80/api/v1/db/write',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try{
        var response = await request.post(options);
        console.log('delete response');
        console.log(response);
        res.status(response.statusCode).json({});
    } catch(error){
        next(error);
    }
});

router.use((req,res,next) => {
    res.status(405).json({});
});

// export the router
module.exports = router


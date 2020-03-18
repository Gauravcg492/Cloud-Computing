// dependencies
const express = require('express');
const request = require('request-promise');
const areas = require("../data/constants");
const helper = require("../helper");
require('dotenv/config');

//variables
const router = express.Router();
const serverName = process.env.SERVER;
const port = process.env.PORT;
const localhost = process.env.LOCALHOST;
const lPort = process.env.L_PORT;
const origin = '35.170.18.147'

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
    console.log('timestamp:');
    console.log(timeStamp);
    // TODO validate
    var body = {};

    var options = {
        url: serverName + ':' + port + '/api/v1/users',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Origin' : origin
        }
    };

    try {
        console.log('Checking for user detail');
        var response = await request.get(options);
        response = JSON.parse(response);
        if(!response.includes(username)){
            res.status(400).json({})
            return;
        }
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
        url: localhost + ':' + lPort + '/api/v1/db/write',
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try {
        console.log('Writing ride details');
        var response = JSON.parse(await request.post(options));
        console.log('Write complete');
        console.log(response);
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
            timestamp : {
                '$gte' : currentDate
            }
        }
    };
    const options = {
        url: localhost + ':' + lPort + '/api/v1/db/read',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try {
        var response = JSON.parse(await request.post(options));
        console.log('Inside get ride');
        console.log(response);
        if (response.length != 0) {
            response = helper.formatResponse(response);
            res.status(200).json(response);
        } else {
            res.status(204).json({});
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
        url: localhost + ':' + lPort + '/api/v1/db/read',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try{
        var response = JSON.parse(await request.post(options));
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
    console.log('request sent');
    console.log(req.body);
    const username = req.body.username;
    const rideId = req.params.rideId;
    const currentDate = new Date();
    console.log('username from req');
    console.log(username);

    var body = {
        action : 4,
        table : 'ride',
        where : {
            rideId : rideId,
            timestamp : {
                '$gte' : currentDate
            },
            created_by : {
                '$ne' : username
            }
        }
    };
    var options = {
        url: localhost + ':' + lPort + '/api/v1/db/read',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Origin' : origin
        }
    }
    try{
        var response = JSON.parse(await request.post(options));
        console.log('After checks in joining');
        console.log(response);
        if(response.length == 0 || response.statusCode === 400){
            res.status(400).json({});
            return;
        }
        body = {};
        console.log('Inside first try');
        console.log(body);
        options.body = JSON.stringify(body);
	    options.url = serverName + ':' + port + '/api/v1/users';
        response = JSON.parse(await request.get(options));
        if(!response.include(username))
        {
            res.status(400).json({});
            return;
        }
    } catch(err){
        console.log(err);
        res.status(400).json({});
        return;
    }

    body = {
        action : 6,
        table : 'ride',
        users : username,
        where : {
            rideId : rideId
        }
    };
    console.log('sending to ride');
    console.log(body);
    options.url = localhost + ':' + lPort + '/api/v1/db/write';
    options.body = JSON.stringify(body);
    options.method = 'POST';

    try{
        var response = JSON.parse(await request.post(options));
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
        url: localhost + ':' + lPort + '/api/v1/db/write',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try{
        var response = JSON.parse(await request.post(options));
        console.log('delete response');
        console.log(response);
        res.status(response.statusCode).json({});
    } catch(error){
        next(error);
    }
});

// Api to return total number of rides
router.get('/count',async (req,res,next) => {
    console.log("Inside ride count");
    const body = {
        table: 'ride',
        action : 2,
        where: {}
    };
    var options = {
        url: localhost + ':' + lPort + '/api/v1/db/read',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    var result = JSON.parse(await request.post(options));
    console.log(result.length);
    res.status(200).json([result.length]);
});

router.use((req,res,next) => {
    res.status(405).json({});
});

// export the router
module.exports = router


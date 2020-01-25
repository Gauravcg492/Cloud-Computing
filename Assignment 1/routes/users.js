// dependencies
const express = require('express');
const helper = require('../helper');
const request = require('request-promise');

//variables
const router = express.Router();

// setting routes
// 1. Add user
router.put('/', async (req, res, next) => {
    // get the data from request body
    const username = req.body.username;
    const password = req.body.password;
    console.log('Entered put request');

    // check if password is SHA1
    if (password == null || !helper.validPass(password)) {
        console.log('Invalid password');
        res.status(400).json({});
    }
    else {
        console.log('passed password check');

        // check if user exists
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
            var response = await request.post(options);
            console.log('first response');
            response = JSON.parse(response);
            const error = new Error('400 Bad Request');
            error.status = 400;
            next(error);
        } catch{
            body = {
                action: 1,
                table: 'user',
                values: [username, password]
            };
            options = {
                url: 'http://localhost:80/api/v1/db/write',
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            response = await request.post(options);
            console.log('after write');
            console.log(response);
            response = JSON.parse(response);
            const statusCode = response.statusCode;

            res.status(statusCode).json({});
        }



    }


});

// 2.Remove user
router.delete('/:username', async (req, res, next) => {
    const username = req.params.username;

    var body = {
        table: 'user',
        action : 2,
        where: {
            username: username
        }
    };
    var options = {
        url: 'http://localhost:80/api/v1/db/write',
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try{
        var response = await request.post(options);
        console.log('delete response');
        console.log(response);
        res.status(200).json({});
    } catch(error){
        next(error);
    }
});

// export the router
module.exports = router


// dependencies
const express = require('express');
const helper = require('../helper');
const dbHandler = require('./db');
const request = require('request-promise');

//variables
const router = express.Router();

// setting routes
// 1. Add user
router.put('/',(req, res, next) => {
    // get the data from request body
    const username = req.body.username;
    const password = req.body.password;
    console.log('Entered put request');

    // check if password is SHA1
    if (!helper.validPass(password)) {
        console.log('Invalid password');
        res.status(400).json({});
    }
    else {
        console.log('passed password check');

        // check if user exists
        var body = {
            table: 'user',
            column: 'username',
            where: {
                username: username
            }
        };
        var options = {
            url: 'http://localhost:80/v1/db/read',
            body: JSON.stringify(body),
            method : 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        var flag = true
        console.log('Sending first request');
        request(options).then((err,response) => {
            console.log(err);
            console.log(response);
            if (!err && response.statusCode == 200) {
                console.log('User exists');
                flag = false;
                res.status(400).json({});
            }
        }).catch((err) => {
            console.log(err);
        });
        console.log(flag);
        /*
        if (flag) {
            body = {
                table: 'user',
                fields: ['username', 'password', 'rides'],
                values: [username, password, []]
            };

            options = {
                url: 'http://localhost:80/v1/db/write',
                body: JSON.stringify(body)
            };
            console.log('Sending second request');
            request.post(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    console.log('User added');
                    res.status(201).json({});
                }
            });
        }*/
    }


});

// 2.Remove user
router.delete('/:username', (req, res, next) => {
    res.status(200).json({
        message: 'delete user',
        name: req.params.username
    });
});

// export the router
module.exports = router


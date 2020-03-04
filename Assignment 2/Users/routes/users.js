// dependencies
const express = require('express');
const helper = require('../helper');
const request = require('request-promise');
require('dotenv/config');

//variables
const router = express.Router();
const serverName = process.env.SERVER;
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
            url: serverName + ':8080/api/v1/db/read',
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
            res.status(400).json({});
        } catch{
            body = {
                action: 1,
                table: 'user',
                values: [username, password]
            };
            options = {
                url: serverName + ':8080/api/v1/db/write',
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
    console.log('in delete');
    /*try{
        var response = await request.post({
            url : serverName + '/api/v1/db/read',
            body : JSON.stringify({
                table : 'ride',
                action : 2,
                where : {
                    created_by : username
                }
            }), 
            headers: {
                'Content-Type': 'application/json'
            }
        });
        response = JSON.parse(response);
        console.log(response);
        if(response.length > 0){
            console.log('sending response');
            res.status(400).json({});
            return;
        }
    }catch(err){
        console.log(err);
    }*/
    

    var body = {
        table: 'user',
        action : 2,
        where: {
            username: username
        }
    };
    var options = {
        url: serverName + ':8080/api/v1/db/write',
        body: JSON.stringify(body),
        method: 'POST',
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
        console.log(error);
        res.status(400).json({});
    }
});


router.get('/', async (req,res,next) => {
    try{
        console.log("Sending get details");
        var body = {
            table : 'user',
            action : 0
        };
        var options = {
            url: serverName + ':8080/api/v1/db/read',	
            method: 'POST',
            body : JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        };
        var response = await request.post(options);
        response = JSON.parse(response);
        console.log(response);
        if(response.length > 0){
            var result = [];
            for(var i=0;i<response.length;i++){
                console.log(response[i]);
                result.push(response[i]['username']);
            }
            console.log(result);
            res.status(200).json(result);
        }else{
            res.status(200).json([]);
        }        
        return;
    }
    catch{
        res.status(204).json(response);
    }
});

router.use((req,res,next) => {
    res.status(405).json({});
});

// export the router
module.exports = router


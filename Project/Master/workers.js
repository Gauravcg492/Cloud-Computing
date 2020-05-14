// dependencies
const amqp = require('amqplib/callback_api');
const User = require('./models/user.js');
const Ride = require('./models/ride');
const AsyncLock = require('async-lock');
require('dotenv/config');

// lock variable to avoid races
const lock = new AsyncLock();

// key for the lock
exports.key = "key_lock";

// db write function which takes care of all write operations 
/*
* actions
* 0 : Delete db
* 1 : Insert record
* 2 : Delete record
* 6 : Update records 
*/
exports.dbWrite = async (req, callback) => {
    const action = req.body.action;
    const table = req.body.table;
    // properties returned to the rideshare apis
    let res = {
        statusCode: 0
    }
    if (action == 0) {
        try {
            let result = await User.remove({});
            let result1 = await Ride.remove({});
            res.status = 200;
            console.log("success");
        }
        catch{
            res.status = 400;
            console.log("Failure");
        }
    }

    if (action == 1) {
        if (table === 'user') {
            const user = new User({
                username: req.body.values[0],
                password: req.body.values[1],
                rides: req.body.values[2]
            });
            console.log(user);
            try {
                const savedUser = await user.save();
                console.log(savedUser);
                res.statusCode = 201;
            } catch (err) {
                console.log('Inside db');
                console.log(err);
                res.statusCode = 500;
            }

        } else if (table === 'ride') {
            const ride = new Ride({
                created_by: req.body.values[0],
                timestamp: req.body.values[1],
                source: req.body.values[2],
                destination: req.body.values[3],
                users: req.body.values[4]
            });
            try {
                console.log('Saving ride details');
                const savedRide = await ride.save();
                console.log(savedRide);
                res.statusCode = 201;
            } catch (err) {
                console.log('Inside ride of db');
                console.log(err);
                res.statusCode = 500;
            }
        }
    } else if (action == 2) {
        if (table === 'user') {
            try {
                let response = await User.deleteOne(req.body.where);
                console.log('delete response');
                console.log(response);
                if (response.deletedCount > 0) {
                    res.statusCode = 200;
                } else {
                    res.statusCode = 400;
                }

            } catch (err) {
                console.log('Inside action 2 user db');
                console.log(err);
                res.statusCode = 400;
            }
        } else if (table == 'ride') {
            try {
                const response = await Ride.deleteOne(req.body.where);
                console.log(response);
                if (response.deletedCount > 0) {
                    res.statusCode = 200;
                } else {
                    res.statusCode = 400;
                }
            } catch (err) {
                console.log('Inside action 2 user db');
                console.log(err);
                res.statusCode = 400;
            }
        }
    } else if (action == 6) {
        if (table == 'ride') {
            try {
                const response = await Ride.updateOne(req.body.where, { $addToSet: { users: req.body.users } });
                console.log(response);
                if (response.nModified == 0) {
                    res.statusCode = 400;
                } else {
                    res.statusCode = 200;
                }
            } catch (err) {
                console.log(err);
                res.statusCode = 400;
            }
        }
    }
    console.log(res);
    callback(res);
}

// db read function which takes care of all write operations 
exports.dbRead = async (req, callback) => {
    const table = req.body.table;
    const action = req.body.action;
    // properties returned to the rideshare apis
    let res = {
        status: 200,
        body: {}
    }
    if (table === "user") {
        console.log('Reading db');
        if (action == 0) {
            try {
                var result = await User.find({}).select('username -_id');
                console.log(result);
                res.body = result;
            }
            catch{
            }
        } else {
            try {
                var result = await User.findOne(req.body.where);
                console.log(result);
                console.log(result.username);
                res.body = { statusCode: 200 };
            } catch (err) {
                console.log('Inside db');
                console.log(err);
                res.status = 400;
                res.body = { statusCode: 400 };
            }
        }

    } else if (table == 'ride') {
        console.log('Ride db read');
        var result;
        try {
            if (action == 2) {
                result = await Ride.find(req.body.where);
            }
            if (action == 4) {
                result = await Ride.find(req.body.where).select('rideId created_by timestamp -_id');
            }
            if (action == 5) {
                result = await Ride.findOne(req.body.where).select('-_id -__v');
            }
            console.log(result);
            res.body = result;
        } catch (err) {
            console.log(err);
            res.body = { statusCode: 400 };
        }
    }
    console.log(res);
    callback(res);
}


// function to read from writeQ and send back the response to orchestrator and fanout to slaves
exports.write = () => {
    // Connect to RabbitMQ
    amqp.connect(process.env.RMQ_ADDR, (err0, connection) => {
        if (!err0) {
            console.log('Master Connected successfully');
            connection.createChannel((err1, channel) => {
                if (!err1) {
                    console.log("Channel created: M");
                    const listenQueue = 'writeQ';
                    // check/create writeQ
                    channel.assertQueue(listenQueue, {
                        durable: true
                    });
                    // consume from writeQ
                    channel.consume(listenQueue, (msg) => {
                        let req = JSON.parse(msg.content.toString());
                        // call db write and pass callback which sends data back
                        this.dbWrite(req, (res) => {
                            console.log(res);
                            console.log("sending to orch");
                            bufferedRes = Buffer.from(JSON.stringify(res));

                            channel.sendToQueue(msg.properties.replyTo, bufferedRes, {
                                correlationId: msg.properties.correlationId
                            });
                            channel.ack(msg);
                            // check if write was successful only then fanout
                            if (res.statusCode == 200 || res.statusCode == 201 || (res.statusCode == 0 && res.status == 200)) {
                                // fanout exchange
                                console.log("Sending to syncQ");
                                const exchangeName = 'syncQ';
                                // check/create an exchange named syncQ
                                channel.assertExchange(exchangeName, 'fanout', {
                                    durable: true
                                });
                                console.log('Publishing write');
                                // publish it to the exchange
                                channel.publish(exchangeName, '', Buffer.from(msg.content.toString()));

                            }
                        });

                    });
                }
            });
        }
    });
};

exports.read = () => {
    // Connect  to RabbitMQ
    amqp.connect(process.env.RMQ_ADDR, (err0, connection) => {
        if (!err0) {
            console.log('Connected successfully readQ');
            connection.createChannel((err1, channel) => {
                if (!err1) {
                    // read part
                    console.log("Channel created: SR");
                    const listenQueue = 'readQ';
                    // check/create readQ
                    channel.assertQueue(listenQueue, {
                        durable: true
                    });
                    // receive only 1 message until it is completed
                    channel.prefetch(1);
                    // consume from readQ
                    channel.consume(listenQueue, (msg) => {
                        console.log("Received message from readQ");
                        // lock used between read and write of slave to avoid race
                        lock.acquire(this.key, (release) => {
                            console.log("acquired lock");
                            req = JSON.parse(msg.content.toString());
                            this.dbRead(req, (res) => {
                                console.log("Sending response");
                                bufferedRes = Buffer.from(JSON.stringify(res));

                                channel.sendToQueue(msg.properties.replyTo, bufferedRes, {
                                    correlationId: msg.properties.correlationId
                                });
                                channel.ack(msg);
                                release();
                            });                            
                        }, (err, ret) => {
                            if (err) {
                                console.log("Error occured");
                                console.log(err);
                            }
                            console.log("Lock released");
                        });
                    });
                    //sync part
                    console.log("Entering SS part");
                    const exchangeName = 'syncQ';
                    // check/create exchange named syncQ
                    channel.assertExchange(exchangeName, 'fanout', {
                        durable: true
                    });
                    // create a queue to listen to 'syncQ' exchange
                    channel.assertQueue('', {
                        exclusive: true
                    }, (err2, q) => {
                        if (!err2) {
                            // binding queue to listen to exchange
                            channel.bindQueue(q.queue, exchangeName, '');
                            // consume from the binded queue
                            channel.consume(q.queue, (msg) => {
                                console.log("Received from synQ");
                                // lock used between read and write of slave to avoid race
                                lock.acquire(this.key, (release) => {
                                    console.log("acquired lock");
                                    req = JSON.parse(msg.content.toString());
                                    this.dbWrite(req, (res) => {
                                        console.log(res);
                                        release();
                                    });                                    
                                }, (err, ret) => {
                                    if (err) {
                                        console.log("Error Occured");
                                        console.log(err);
                                    }
                                    console.log("realeased lock");
                                });
                            }, {
                                noAck: true
                            });
                        }
                    });
                }
            });
        }
    });
}
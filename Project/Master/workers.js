const amqp = require('amqplib/callback_api');
const User = require('./models/user.js');
const Ride = require('./models/ride');
const AsyncLock = require('async-lock');
require('dotenv/config');

const lock = new AsyncLock();

exports.key = "key_lock";

exports.dbWrite = async (req, callback) => {
    const action = req.body.action;
    const table = req.body.table;

    let res = {
        statusCode: 0
    }
    if (action == 0) {
        try {
            let result = await User.remove({});
            let result1 = await Ride.remove({});
            //res.status(200).json({});
            res.status = 200;
            console.log("success");
        }
        catch{
            //res.status(400).json({});
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
                //res.json({ statusCode: 201 });
                res.statusCode = 201;
            } catch (err) {
                console.log('Inside db');
                console.log(err);
                //res.json({ statusCode: 500 });
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
                //res.json({ statusCode: 201 });
                res.statusCode = 201;
            } catch (err) {
                console.log('Inside ride of db');
                console.log(err);
                //res.json({ statusCode: 500 });
                res.statusCode = 500;
            }
        }
    } else if (action == 2) {
        if (table === 'user') {
            try {
                //const username = req.body.where.username;
                //var response = await Ride.updateMany({users : username}, {$pull : {users : username}});
                //console.log('Update response');
                //console.log(response);
                let response = await User.deleteOne(req.body.where);
                console.log('delete response');
                console.log(response);
                if (response.deletedCount > 0) {
                    //res.status(200).json({ statusCode: 200 });
                    res.statusCode = 200;
                } else {
                    //res.status(200).json({ statusCode: 400 });
                    res.statusCode = 400;
                }

            } catch (err) {
                console.log('Inside action 2 user db');
                console.log(err);
                //res.status(400).json({ statusCode: 400 });
                res.statusCode = 400;
            }
        } else if (table == 'ride') {
            try {
                const response = await Ride.deleteOne(req.body.where);
                console.log(response);
                if (response.deletedCount > 0) {
                    //res.status(200).json({ statusCode: 200 });
                    res.statusCode = 200;
                } else {
                    //res.status(200).json({ statusCode: 400 });
                    res.statusCode = 400;
                }
            } catch (err) {
                console.log('Inside action 2 user db');
                console.log(err);
                //res.status(400).json({ statusCode: 400 });
                res.statusCode = 400;
            }
        }
    } else if (action == 6) {
        if (table == 'ride') {
            try {
                const response = await Ride.updateOne(req.body.where, { $addToSet: { users: req.body.users } });
                console.log(response);
                if (response.nModified == 0) {
                    //res.json({ statusCode : 400 });
                    res.statusCode = 400;
                } else {
                    //res.status(200).json({ statusCode : 200 });
                    res.statusCode = 200;
                }
            } catch (err) {
                console.log(err);
                //res.status(400).json({ statusCode : 400 });
                res.statusCode = 400;
            }
        }
    }
    console.log(res);
    /*return new Promise((resolve) => {
        resolve(res);
    });*/
    callback(res);
}

exports.dbRead = async (req, callback) => {
    const table = req.body.table;
    const action = req.body.action;

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
                //res.status(200).json(result);
                res.body = result;
            }
            catch{
                //res.status(200).json({});
            }
        } else {
            try {
                var result = await User.findOne(req.body.where);
                console.log(result);
                console.log(result.username);
                //res.status(200).json({ statusCode: 200 });
                res.body = { statusCode: 200 };
            } catch (err) {
                console.log('Inside db');
                console.log(err);
                //res.status(400).json({ statusCode : 400 });
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
            //res.status(200).json(result);
            res.body = result;
        } catch (err) {
            console.log(err);
            //res.status(200).json({ statusCode : 400 });
            res.body = { statusCode: 400 };
        }
    }
    console.log(res);
    callback(res);
}


exports.write = () => {
    amqp.connect(process.env.RMQ_ADDR, (err0, connection) => {
        if (!err0) {
            console.log('Master Connected successfully');
            connection.createChannel((err1, channel) => {
                if (!err1) {
                    console.log("Channel created: M");
                    const listenQueue = 'writeQ';
                    channel.assertQueue(listenQueue, {
                        durable: true
                    });
                    channel.consume(listenQueue, (msg) => {
                        let req = JSON.parse(msg.content.toString());
                        this.dbWrite(req, (res) => {
                            console.log(res);
                            console.log("sending to orch");
                            bufferedRes = Buffer.from(JSON.stringify(res));

                            channel.sendToQueue(msg.properties.replyTo, bufferedRes, {
                                correlationId: msg.properties.correlationId
                            });
                            channel.ack(msg);
                            if (res.statusCode == 200 || res.statusCode == 201 || (res.statusCode == 0 && res.status == 200)) {
                                // fanout exchange
                                console.log("Sending to syncQ");
                                const exchangeName = 'syncQ';

                                channel.assertExchange(exchangeName, 'fanout', {
                                    durable: true
                                });
                                console.log('Publishing write');
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
    // TODO threading
    // process listening from readQ
    amqp.connect(process.env.RMQ_ADDR, (err0, connection) => {
        if (!err0) {
            console.log('Connected successfully readQ');
            connection.createChannel((err1, channel) => {
                if (!err1) {
                    // read part
                    console.log("Channel created: SR");
                    const listenQueue = 'readQ';
                    channel.assertQueue(listenQueue, {
                        durable: true
                    });
                    channel.prefetch(1);
                    channel.consume(listenQueue, (msg) => {
                        console.log("Received message from readQ");
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
                    channel.assertExchange(exchangeName, 'fanout', {
                        durable: true
                    });
                    channel.assertQueue('', {
                        exclusive: true
                    }, (err2, q) => {
                        if (!err2) {
                            channel.bindQueue(q.queue, exchangeName, '');

                            channel.consume(q.queue, (msg) => {
                                console.log("Received from synQ");
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
    /*else { // process listening from syncQ
           amqp.connect('amqp://rabbitmq', (err0, connection) => {
               if (!err0) {
                   console.log("Successfully connected synQ");
   
                   connection.createChannel((err1, channel) => {
                       if (!err1) {
                           console.log("Channel created: SS");
                           const exchangeName = 'syncQ';
                           channel.assertExchange(exchangeName, 'fanout', {
                               durable: true
                           });
   
                           channel.assertQueue('', {
                               exclusive: true
                           }, (err2, q) => {
                               if (!err2) {
                                   channel.bindQueue(q.queue, exchangeName, '');
   
                                   channel.consume(q.queue, (msg) => {
                                       req = JSON.parse(msg.content.toString());
                                       res = this.dbWrite(req);
                                       while (res.statusCode != 200 || res.statusCode != 201 || (res.statusCode == 0 && res.status != 200)) {
                                           res = this.dbWrite(req)
                                       }
                                   }, {
                                       noAck: true
                                   });
                               }
                           })
                       }
                   });
               }
           });
   
       }*/
}
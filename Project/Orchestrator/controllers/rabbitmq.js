// dependencies
const amqp = require('amqplib/callback_api');

// variables
const rmqAddr = process.env.RMQ_ADDR;

// to generate random id
exports.generateUuid = () => {
    return Math.random().toString() + Math.random().toString() + Math.random().toString();
}

// function to send request to writeQ
exports.sendToWriteQ = (req, res, next) => {
    // connect to RabbitMQ
    amqp.connect(rmqAddr, (err0, connection) => {
        if(!err0) {
            console.log("Write connected successfully");
            // create channel
            connection.createChannel((err1, channel) => {
                if(!err1) {
                    console.log("Created channel : W");
                    const queue = 'writeQ';
                    // create random named queue for receiving the response
                    channel.assertQueue('', {
                        exclusive: true
                        }, (err2, q) => {
                        if(!err2){
                            const corelationId = this.generateUuid();

                            // callback to receive message sent back from master
                            channel.consume(q.queue, (msg) => {
                                // receive for the request that was sent only 
                                if(msg.properties.correlationId === corelationId) {
                                    console.log("Received reply");
                                    reply = JSON.parse(msg.content.toString());
                                    console.log(reply);
                                    if(reply.statusCode != 0){
                                        res.status(200).json(reply);
                                    } else {
                                        res.status(reply.status).json({});
                                    }    
                                    // close connection if no response                                
                                    setTimeout(() => {
                                        connection.close();
                                        //process.exit(0);
                                    },500);
                                }
                            }, {
                                noAck: true
                            });

                            // assert main queue
                            channel.assertQueue(queue, {
                                durable: true
                            });
                            // send to writeQ
                            console.log("Sending to writeq");
                            //console.log(req);
                            request = {
                                body: req.body
                            }
                            channel.sendToQueue(queue, Buffer.from(JSON.stringify(request)), {
                                correlationId: corelationId,
                                replyTo: q.queue
                            });
                        }
                    });
                }
            });
        }
    });
};

// function to send request to readQ
exports.sendToReadQ = (req, res, next) => {
    amqp.connect(rmqAddr, (err0, connection) => {
        if(!err0) {
            console.log("Read connected successfully");
            // create channel
            connection.createChannel((err1, channel) => {
                if(!err1) {
                    console.log("Created channel : R");
                    const queue = 'readQ';
                    // create random named queue for receiving the response
                    channel.assertQueue('', {
                        exclusive: true
                        }, (err2, q) => {
                        if(!err2){
                            const correlationId = this.generateUuid();
                            // callback to receive response sent back from slave
                            channel.consume(q.queue, (msg) => {
                                if(msg.properties.correlationId === correlationId) {
                                    reply = JSON.parse(msg.content.toString());
                                    res.status(reply.status).json(reply.body);
                                    setTimeout(() => {
                                        connection.close();
                                        //process.exit(0);
                                    },500);
                                }
                            }, {
                                noAck: true
                            });

                            // send to writeQ
                            request = {
                                body: req.body
                            }
                            console.log("Sending to readQ");
                            channel.sendToQueue(queue, Buffer.from(JSON.stringify(request)), {
                                correlationId: correlationId,
                                replyTo: q.queue
                            });
                        }
                    });
                }
            });
        }
    });
};
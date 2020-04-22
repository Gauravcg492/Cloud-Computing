const amqp = require('amqplib/callback_api');

exports.generateUuid = () => {
    return Math.random().toString() + Math.random().toString() + Math.random().toString();
}

exports.sendToWriteQ = (req, res, next) => {
    let done = 0;
    amqp.connect('amqp://rabbitmq', (err0, connection) => {
        if(!err0) {
            console.log("Write connected successfully");
            // create channel
            connection.createChannel((err1, channel) => {
                if(!err1) {
                    console.log("Created channel : W");
                    const queue = 'writeQ';
                    channel.assertQueue('', {
                        exclusive: true
                        }, (err2, q) => {
                        if(!err2){
                            const corelationId = this.generateUuid();

                            // callback
                            channel.consume(q.queue, (msg) => {
                                if(msg.properties.correlationId === corelationId) {
                                    done = 1;
                                    reply = JSON.parse(msg.content.toString());
                                    if(reply.statusCode == 0){
                                        res.status(reply.status).json({});
                                    } else {
                                        res.status(200).json(reply);
                                    }                                    
                                    setTimeout(() => {
                                        connection.close();
                                        process.exit(0);
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
                            channel.sendToQueue(queue, Buffer.from(JSON.stringify(res)), {
                                correlationId: corelationId,
                                replyTo: q.queue
                            });
                        }
                    });
                }
            });
        }
    });
    if(!done){
        res.status(500).json();
    }
};

exports.sendToReadQ = (req, res, next) => {
    let done = 0;
    amqp.connect('amqp://rabbitmq', (err0, connection) => {
        if(!err0) {
            console.log("Read connected successfully");
            // create channel
            connection.createChannel((err1, channel) => {
                if(!err1) {
                    console.log("Created channel : R");
                    const queue = 'ReadQ';
                    channel.assertQueue('', {
                        exclusive: true
                        }, (err2, q) => {
                        if(!err2){
                            const correlationId = this.generateUuid();

                            // callback
                            channel.consume(q.queue, (msg) => {
                                if(msg.properties.correlationId === correlationId) {
                                    done = 1;
                                    reply = JSON.parse(msg.content.toString());
                                    res.status(reply.status).json(reply.body);
                                }
                            }, {
                                noAck: true
                            });

                            // send to writeQ
                            channel.sendToQueue(queue, Buffer.from(JSON.stringify(req)), {
                                correlationId: correlationId,
                                replyTo: q.queue
                            });
                        }
                    });
                }
            });
        }
    });
    if(!done){
        res.status(500).json();
    }
};
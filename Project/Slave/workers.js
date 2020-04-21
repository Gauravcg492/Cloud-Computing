const amqp = require('amqplib/callback_api');
const mongoose = require('mongoose');

exports.dbWrite = (req) => {
    // TODO add db write code here
}

exports.dbRead = (req) => {
    // TODO add db read code here
}

exports.write = () => {
    amqp.connect('amqp://rabbitmq', (err0, connection) {
        if (!err0) {
            console.log('Master Connected successfully');
            connection.createChannel((err1, channel) => {
                if (!err1) {
                    console.log("Channel created: M");
                    const listenQueue = 'writeQ';
                    channel.assertQueue(listenQueue, {
                        durable: true
                    });
                    channel.assertQueue(sendQueue, {
                        durable: true
                    });

                    channel.consume(listenQueue, (msg) => {
                        req = JSON.parse(msg.content.toString());
                        res = this.dbWrite(req);
                        bufferedRes = Buffer.from(JSON.stringify(res));

                        channel.sendToQueue(msg.properties.replyTo, bufferedRes, {
                            correlationId: msg.properties.correlationId
                        });
                        channel.ack(msg);
                        if (res.status == 200 || res.status == 201) {
                            // fanout exchange
                            const exchangeName = 'syncQ';

                            channel.assertExchange(exchangeName, 'fanout', {
                                durable: true
                            });
                            console.log('Publishing write');
                            channel.publish(exchangeName, '', msg);

                        }
                    });
                }
            });
        }
    });
};

exports.read = (val) => {
    // TODO threading
    // process listening from readQ
    if (val) {
        amqp.connect('amqp://rabbitmq', (err0, connection) {
            if (!err0) {
                console.log('Connected successfully readQ');
                connection.createChannel((err1, channel) => {
                    if (!err1) {
                        console.log("Channel created: SR");
                        const listenQueue = 'readQ';
                        channel.assertQueue(listenQueue, {
                            durable: true
                        });

                        channel.consume(listenQueue, (msg) => {
                            req = JSON.parse(msg.content.toString());
                            res = this.dbRead(req);
                            bufferedRes = Buffer.from(JSON.stringify(res));

                            channel.sendToQueue(msg.properties.replyTo, bufferedRes, {
                                correlationId: msg.properties.correlationId
                            });
                            channel.ack(msg);
                        });
                    }
                });
            }
        });
    } else { // process listening from syncQ
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
                                    while(res.status != 200 || res.status != 201)
                                    {
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

    }
}
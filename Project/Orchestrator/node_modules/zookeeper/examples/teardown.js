const { createClient } = require('./wrapper.js');
const notifier = require('./notifier.js');
const { deleteNode } = require('./deletenode.js');

async function deleteAllNodes(client, paths) {
    const promises = [];
    paths.forEach((path) => {
        promises.push(deleteNode(client, path));
    });

    const messages = await Promise.all(promises);
    messages.forEach((message) => {
        notifier.emit('deleteNode', message);
    });
}

async function deleteNodes(paths) {
    const client = createClient();

    client.on('close', () => {
        notifier.emit('close', `session closed, id=${client.client_id}`);
    });

    client.on('connect', () => {
        notifier.emit('connect', `session established, id=${client.client_id}`);

        deleteAllNodes(client, paths);
    });

    client.init({});
}

module.exports = {
    deleteNodes,
};

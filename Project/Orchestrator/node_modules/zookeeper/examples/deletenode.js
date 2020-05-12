/**
 * @param client {ZooKeeperPromise}
 * @param path {string}
 * @returns {Promise}
 */
async function deleteNode(client, path) {
    try {
        // eslint-disable-next-line no-underscore-dangle
        await client.delete_(path, -1);
        return `(deleted: ${path})`;
    } catch (error) {
        return `Error when deleting ${path}. ${error.message}`;
    }
}

module.exports = {
    deleteNode,
};

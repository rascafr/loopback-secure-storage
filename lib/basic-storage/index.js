/**
 * This library contains everything needed to simulate the Loopback's storage module
 * @author François Leparoux
 */

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

/**
 * Creates the true filepath (private)
 */
function getFilePath(container, fileName) {
    return `${process.cwd()}/${container}/${fileName}`;
}

/**
 * Reads the config file (storage.NODE_ENV.json)
 */
exports.getConfig = function(objName) {
    return JSON.parse(fs.readFileSync(`${process.cwd()}/server/storage.${process.env.NODE_ENV}.json`,'utf-8'))[objName];
}

/**
 * Check if a file exists in the given container
 * callback(exists)
 */
exports.checkIfExists = function(container, fileName, cb) {
    fs.access(getFilePath(container, fileName), fs.F_OK, (err) => {
        cb(err ? false : true);
    });
}

/**
 * Reads data from a file in the given container
 * callback(error, fileData)
 */
exports.readFileData = function(container, fileName, cb) {
    fs.readFile(getFilePath(container, fileName), (err, data) => {
        cb(err, data);
    });
}

/**
 * Writes data into a file in the given container
 * callback(error)
 */
exports.writeFileData = function(container, fileName, fileData, cb) {
    fs.writeFile(getFilePath(container, fileName), fileData, (err) => {
        cb(err);
    });
}

/**
 * Deletes a file in the given container
 * callback(deleted)
 */
exports.deleteFile = function(container, fileName, cb) {
    fs.unlink(getFilePath(container, fileName), (err) => {
        cb(err ? false : true);
    });
}

/**
 * Generates a random file name, but keep the extension
 */
exports.genUniqueName = function(fileName) {
    return uuid.v4() + path.extname(fileName);
}
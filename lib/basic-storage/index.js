/**
 * This library contains everything needed to simulate the Loopback's storage module
 * @author François Leparoux
 */

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const mkdirp = require('mkdirp');

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
    // if NODE_ENV is defined, add it to storage config (loopback classic behavior)
    // add a dot character for extension support
    const envStr = process.env.NODE_ENV && process.env.NODE_ENV.length > 0 ? `.${process.env.NODE_ENV}` : ``;
    try {
        const configStr = fs.readFileSync(`${process.cwd()}/server/storage${envStr}.json`,'utf-8');
        return JSON.parse(configStr)[objName];
    } catch (e) {
        console.error('[SecureStorage] No storage.json config file has been defined, module will not work properly until this is fixed.');
        return null;
    }
}

exports.checkStoragePath = function(config) {
    const rootDir = `${process.cwd()}/${config.root}/`;
    if (!fs.existsSync(rootDir)) {
        mkdirp(rootDir, (err) => {
            if (err) console.error('[SecureStorage] cannot create root directory. Please verify write access.');
            console.log(`=== Storage directory "${config.root}" has been created.`);
        });
    }
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
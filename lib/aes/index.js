/**
 * This library contains everything needed to encrypt / decrypt data using the AES standard
 * @author François Leparoux
 */

const aesjs = require('aes-js');

/**
 * Checks if a given key is a proper 128 bit one (array of 16 bytes = 16x8 = 128)
 */
exports.checkKey128 = function(key) {
    if (!key || key.length !== 16) {
        return false;
    }
    let valid = true;
    key.forEach(ki => {
        if (ki < 0 || ki >= 256) {
            valid = false;
        }
    });
    return valid;
}

/**
 * Generates a 128 bits key (16*8) using random function
 * returns both real (array) and hex string values
 */
exports.genKey128 = function() {
    let key = [];
    for (let i=0;i<16;i++) {
        key.push(Math.floor(Math.random() * Math.floor(256)));
    }
    return {
        bytes: key,
        hex: exports.byteArrayToHex(key)
    }
}

/**
 * Encrypt a certain amount of data (as bytes) and return the content as encrypted
 */
exports.encryptData = function(key, data) {
    var aesEncrCtr = new aesjs.ModeOfOperation.ctr(key);
    return aesEncrCtr.encrypt(data);
}

/**
 * Decrypt a certain amount of data (as bytes) and return the content as decrypted
 */
exports.decryptData = function(key, data) {
    var aesEncrCtr = new aesjs.ModeOfOperation.ctr(key);
    return aesEncrCtr.decrypt(data);
}

/**
 * Converts the given string into a byte array
 */
exports.stringToByteArray = function(stringData) {
    return aesjs.utils.utf8.toBytes(stringData);
}

/**
 * Converts the byte array into a string
 */
exports.byteArrayToString = function(stringData) {
    return aesjs.utils.utf8.fromBytes(stringData);
}

/**
 * Converts the given hex string into a byte array
 */
exports.hexToByteArray = function(hexString) {
    return aesjs.utils.hex.toBytes(hexString);
}

/**
 * Converts the given byte array into a string (hex format)
 */
exports.byteArrayToHex = function(data) {
    return aesjs.utils.hex.fromBytes(data);
}
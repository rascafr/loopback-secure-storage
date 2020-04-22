/**
 * Basic implementation of BasicStorage with the AES encryption standard applied above
 * @author François Leparoux
 */

const AES = require('../aes');
const BasicStorage = require('../basic-storage');
const Functions = require('./functions');

class SecureStorage {
    constructor() {
        this.config = null;
    }

    getRandomKey() {
        return AES.genKey128();
    }

    asKiB(bytes) {
        return bytes * 1024;
    }

    asMiB(bytes) {
        return this.asKiB(bytes) * 1024;
    }

    asGiB(bytes) {
        return this.asMiB(bytes) * 1024;
    }

    /**
     * Use the given config if available, use the storage.json file otherwise
     * @param {*} configOrStorageConfigKey the config object, or the key to use from storage.json file if no config provided
     */
    init(configOrStorageConfigKey) {

        let config = typeof configOrStorageConfigKey === 'string' ? null : configOrStorageConfigKey;

        if (!config) {
            config = BasicStorage.getConfig(configOrStorageConfigKey);
        }

        if (BasicStorage.checkStoragePath(config)) {
            this.config = config;
            this.config.byteKey = AES.hexToByteArray(this.config.sysKey);
        }
    }

    /**
     * Encrypt and stores a file in the container defined in config
     * @param {*} filename 
     * @param {*} data 
     * @param {*} Optional callback / returned as promise
     */
    writeFile(filename, data, callback) {
        return new Promise((resolve, reject) => {
            Functions.secureWriteFileData(this.config.root, filename, this.config.byteKey, new Buffer(data), (err) => {
                return callback ? callback(err) : err ? reject(err) : resolve();
            });
        });
    }

    /**
     * Reads then decrypts a file from the container defined in config
     * @param {*} filename 
     * @param {*} Optional callback / returned as promise
     */
    readFile(filename, callback) {
        return new Promise((resolve, reject) => {
            Functions.secureReadFileData(this.config.root, filename, this.config.byteKey, (err, data) => {
                data = new Buffer(data);
                return callback ? callback(err, data) : err ? reject(err) : resolve(data);
            });
        });
    }
    
    /**
     * Deletes a file from the container defined in config
     * @param {*} filename 
     * @param {*} Optional callback / returned as promise
     */
    deleteFile(filename, callback) {
        return new Promise((resolve) => {
            Functions.secureDeleteFileData(this.config.root, filename, (deleted) => {
                return callback ? callback(null, deleted) : resolve(deleted);
            });
        });
    }

    /**
     * Uploads, a file, verify extension, size, mime type encrypts and the stores it in the container defined in config
     * @param {*} context the Loopback http ctx object, {req} if isued in express directly
     * @param {*} callback(err, savedFileInfo)
     */
    uploadFile(context, callback) {
        Functions.saveAsEncryptedHTTPFile(this.config, context, callback);
    }

    /**
     * Decrypt then downloads a file from the container defined in config
     * @param {*} filename
     * @param {*} httpResponse the 'res' object from loopback or express used to write status, headers and data
     */
    downloadFile(filename, httpResponse) {
        Functions.streamAsDecryptedHTTPFile(this.config, filename, httpResponse);
    }
}

module.exports = new SecureStorage();

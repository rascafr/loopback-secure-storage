const AES = require('../aes');
const BasicStorage = require('../basic-storage');
const FormFileParser = require('../form-file-parser');
const path = require('path');

/**
 * Reads then reads data from a file in the given container
 * callback(error, decryptedData)
 */
exports.secureReadFileData = function(container, fileName, key, cb) {
    BasicStorage.readFileData(container, fileName, (err, fileData) => {
        if (err) cb(err);
        else cb(null, AES.decryptData(key, fileData));
    });
}

/**
 * Encrypts then writes data into a file in the given container
 * callback(error)
 */
exports.secureWriteFileData = function(container, fileName, key, fileData, cb) {
    BasicStorage.writeFileData(container, fileName, AES.encryptData(key, fileData), cb);
}

/**
 * Deletes a file from a given container
 * callback(success)
 */
exports.secureDeleteFileData = function(container, fileName, cb) {
    // RFU: write 10x dummy data into file (get cursor) then delete it
    // (prevents ghost memory data)
    BasicStorage.deleteFile(container, fileName, cb);
}

// ---- more generic functions ---- //

exports.saveAsEncryptedHTTPFile = function(SecureConfig, httpCtx, cb) {

    // Get config params
    let {name, root, nameMakeUnique, maxFileSize, allowedContentTypes, allowedExtensions, byteKey} = SecureConfig;

    // Parse file, get first
    let files = FormFileParser.parse(httpCtx);
    if (files.length != 1) {
        return cb({status: '412'});
    }
    let file = files[0];

    // check if mime ok
    if (allowedContentTypes && !allowedContentTypes.includes(file.fileMime)) {
        return cb({status: '412'});
    }

    // check extension
    if (allowedExtensions && !allowedExtensions.includes(path.extname(file.fileName).substr(1))) {
        return cb({status: '412'});
    }

    // Check file size
    if (maxFileSize && file.fileSize > maxFileSize) {
        return cb({status: '413'});
    }

    // Make unique? Generate fileName
    file.originalFileName = file.fileName;
    if (nameMakeUnique) file.fileName = BasicStorage.genUniqueName(file.fileName);

    // Save
    exports.secureWriteFileData(root, file.fileName, byteKey, file.fileData, (err) => {
        if (err) cb({status: '500'});
        else cb(null, {...file, fields: httpCtx.req.body});
    });
}

exports.streamAsDecryptedHTTPFile = function(SecureConfig, fileName, res) {

    // read, then expose on HTTP as response through express
    exports.readAsDecryptedBytes(SecureConfig, fileName, (err, data) => {
        if (err) res.status(400).json({ error: err })
        else {
            res.set('Content-Type','application/force-download');
            res.set('Content-Type','application/octet-stream');
            res.set('Content-Type','application/download');
            res.set('Content-Disposition','attachment;filename=' + fileName);
            res.set('Content-Transfer-Encoding','binary');
            res.send(new Buffer(data));
        }
    });
}

exports.readAsDecryptedBytes = function(SecureConfig, fileName, cb) {

    // Get config params
    let {root, byteKey} = SecureConfig;

    // Read file and decrypt content
    exports.secureReadFileData(root, fileName, byteKey, (err, data) => {
        cb(err, data)
    });
}

exports.secureDelete = function(SecureConfig, fileName, cb) {

    // Get config params
    let {root} = SecureConfig;

    // Delete!
    exports.secureDeleteFileData(root, fileName, cb);
}
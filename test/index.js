const assert = require('assert');
const rimraf = require('rimraf');
const express = require('express');
const request = require('request');
const multer = require('multer');
const bodyParser = require('body-parser');

describe('SecureStorage', () => {

    const SecureStorage = require('..');
    const STORAGE_DIR = './test/storage';
    const TEST_FILE = 'test.txt';
    const UPLOAD_FILE = 'upload.txt';
    const UPLOAD_WRONG_FILE = 'upload.exe';
    const TEST_DATA = 'Hello world, some data to write!';
    const secureConfig = {
        root: `${STORAGE_DIR}/container`,
        nameMakeUnique: true,
        maxFileSize: SecureStorage.asMiB(50),
        allowedContentTypes: [
            "text/plain"
        ],
        allowedExtensions: [
            "txt"
        ],
        sysKey: null
    };
    let tmpExpressServerHandle = null; // so we can close express at the end

    // clean before starting tests
    describe('before test: cleanup', () => {
        it('should cleanup temporary storage directory', (done) => {
            rimraf(STORAGE_DIR, done);
        });
    });

    describe('main functions', () => {

        describe('#getRandomKey', () => {
            it('should return a 16 bytes random key', () => {
                secureConfig.sysKey = SecureStorage.getRandomKey().hex;
                assert.equal(secureConfig.sysKey.length, 32); // 16 bytes * 2 hex char
            });
        });

        describe('#init', () => {
            it('should initialise properly without crashing', () => {
                SecureStorage.init(secureConfig)
                assert.notEqual(SecureStorage.config, null);
            });
        });

        describe('#writeFile<Promise>', () => {
            it('should write encrypted file without error (promise)', () => {
                return SecureStorage.writeFile(TEST_FILE, TEST_DATA);
            });
        });

        describe('#readFile<Promise>', () => {
            it('should read previously written file without error (promise)', () => {
                return SecureStorage.readFile(TEST_FILE).then(data => {
                    assert.equal(data.toString(), TEST_DATA);
                });
            });
        });

        describe('#deleteFile<Promise>', () => {
            it('should delete previously written file without error (promise)', () => {
                return SecureStorage.deleteFile(TEST_FILE).then(deleted => {
                    assert.equal(deleted, true);
                });
            });
        });

        describe('#writeFile(err)', () => {
            it('should write encrypted file without error (callback)', (done) => {
                SecureStorage.writeFile(TEST_FILE, TEST_DATA, done);
            });
        });

        describe('#readFile(err, data)', () => {
            it('should read previously written file without error (callback)', (done) => {
                SecureStorage.readFile(TEST_FILE, (err, data) => {
                    if (err) return done(err);
                    assert.equal(data.toString(), TEST_DATA);
                    done();
                });
            });
        });

        describe('#deleteFile(err, deleted)', () => {
            it('should delete previously written file without error (callback)', (done) => {
                SecureStorage.deleteFile(TEST_FILE, (err, deleted) => {
                    if (err) return done(err);
                    assert.equal(deleted, true);
                    done();
                });
            });
        });
    });

    describe('server functions', () => {

        // dummy server that will handle requests like loopback
        const loopback = express();
        const lbPort = 4201;
        let tmpUniqueFileName = '';
        loopback.use(multer().any());

        // create file route
        loopback.post('/uploadFile', (req, res) => {
            SecureStorage.uploadFile({req}, (err, fileObj) => {
                if (err) res.status(err.status || 400).send(JSON.stringify(err));
                else res.end(JSON.stringify(fileObj));
            });
        });

        // download file route
        loopback.get('/downloadFile', (req, res) => {
            SecureStorage.downloadFile(tmpUniqueFileName, res);
        });

        it('needs express to test server function so we have to start it now', (done) => {
            tmpExpressServerHandle = loopback.listen(lbPort, () => {
                done();
            });
        });

        it('should be able to upload and encrypt a file', (done) => {

            // client request
            const req = request.post(`http://localhost:${lbPort}/uploadFile`, function (err, resp, body) {
                if (err) return done(err);
                let uploadResult = JSON.parse(body);

                assert.notEqual(uploadResult.fileName, UPLOAD_FILE, 'generated file name should be unique');
                tmpUniqueFileName = uploadResult.fileName;
                assert.equal(uploadResult.originalFileName, UPLOAD_FILE, 'original file name should be the same as the one that has been sent');
                
                done();
            });
            const form = req.form();
            form.append('file', new Buffer(TEST_DATA), {
                filename: UPLOAD_FILE,
                contentType: 'text/plain'
            });
        });

        it('should be able to download a decrypted file', (done) => {

            // client request
            request.get(`http://localhost:${lbPort}/downloadFile`, function (err, resp, body) {
                const { headers } = resp;

                assert.equal(headers['content-type'], 'application/download', 'response header content-type');
                assert.equal(headers['content-disposition'], `attachment;filename=${tmpUniqueFileName}`, 'response header content-disposition');
                assert.equal(headers['content-transfer-encoding'], 'binary', 'response header content-transfer-encoding');
                
                assert.equal(body, TEST_DATA, 'decrypted and downloaded data should be the same as the one that has been uploaded');
                done(err);
            });
        });

        it('should not be able to upload a file with a wrong extension', (done) => {

            // client request
            const req = request.post(`http://localhost:${lbPort}/uploadFile`, function (err, resp, body) {
                if (err) return done(err);
                const { statusCode } = resp;
                assert.equal(statusCode, 412, 'HTTP status code should indicate upload has been refused');
                done();
            });
            const form = req.form();
            form.append('file', new Buffer(TEST_DATA), {
                filename: UPLOAD_WRONG_FILE,
                contentType: 'text/plain'
            });
        });

        it('should not be able to upload a file with a wrong mime type', (done) => {

            // client request
            const req = request.post(`http://localhost:${lbPort}/uploadFile`, function (err, resp, body) {
                if (err) return done(err);
                const { statusCode } = resp;
                assert.equal(statusCode, 412, 'HTTP status code should indicate upload has been refused');
                done();
            });
            const form = req.form();
            form.append('file', new Buffer(TEST_DATA), {
                filename: UPLOAD_FILE,
                contentType: 'application/zip'
            });
        });

        it('should not be able to upload a file with data size that exceeds the config limit', (done) => {

            // override size limit
            SecureStorage.config.maxFileSize = 10; // 10 bytes

            // client request
            const req = request.post(`http://localhost:${lbPort}/uploadFile`, function (err, resp, body) {
                if (err) return done(err);
                const { statusCode } = resp;
                assert.equal(statusCode, 413, 'HTTP status code should indicate upload has been refused');
                done();
            });
            const form = req.form();
            form.append('file', new Buffer(TEST_DATA), {
                filename: UPLOAD_FILE,
                contentType: 'text/plain'
            });
        });
    });

    describe('util functions', () => {

        describe('#asKiB', () => {
            it('should convert bytes to kibibytes properly', () => {
                assert.equal(SecureStorage.asKiB(1), Math.pow(2, 10));
            });
        });

        describe('#asMiB', () => {
            it('should convert bytes to mebibytes properly', () => {
                assert.equal(SecureStorage.asMiB(1), Math.pow(2, 20));
            });
        });

        describe('#asGiB', () => {
            it('should convert bytes to gibibytes properly', () => {
                assert.equal(SecureStorage.asGiB(1), Math.pow(2, 30));
            });
        });
    });

    // clean after running tests
    describe('after test: cleanup', () => {
        it('should cleanup temporary storage directory', (done) => {
            rimraf(STORAGE_DIR, done);
        });

        it('should close test express instance properly', (done) => {
            tmpExpressServerHandle.close(() => {
                done();
            });
        });
    });
});

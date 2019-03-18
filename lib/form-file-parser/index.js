/**
 * This file contains the code needed to parse a HTTP request (form/data) that contains a file
 */

/**
 * Handles a context / request from Loopback (multer)
 * and returns the file(s) data / info
 */
exports.parse = function(ctx) {
    let files = ctx.req.files;
    return files.map(f => {
        return {
            fileName: f.originalname,
            fileEncoding: f.encoding,
            fileMime: f.mimetype,
            fileSize: f.size,
            fileData: f.buffer
        }
    });
}
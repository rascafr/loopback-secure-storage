# loopback-secure-storage
Secure (AES) file system storage component for Express & Loopback / IBM API ORM

## Changelog

### Version 2

Work has been done on the library, thereby is it not compatible with the previous versions (last one was 1.1.7). It is now used as a singleton and not a stateless module anymore.

Your current configuration json file is still compatible, but now you can specify the allowed extensions (combined with the mime type check).

You can also setup the configuration as a js object when calling the initialisation method of the module instance.

For everyone to be satisfied, the module's methods can be used as promises or with callback (excepted for the servers methods).

## Features

- AES encryption / decryption
- HTTP upload / download support methods (express-compatible)
- 128bits key support (generate / use / check)
- compatible with Loopback's storage component (usage, config)
- can be used as an express method

## Example

Because code is always better than a Markdown file, an example is available [here](https://github.com/rascafr/example-loopback-secure-storage). Feel free to clone and tweak it!

## Installation

In your own project, run `npm i loopback-secure-storage` and you're good to go.

## Configuration

The configuration object expected by the module is the following one:

```js
const config = {
    name: "secureStorageConfig",            // Container name

    root: `./storage/container`,            // Container root directory (project root reference)

    nameMakeUnique: true,                   // set to true to prevent name collisions for the uploaded files

    maxFileSize: SecureStorage.asMiB(50),   // maximum byte size: as KiB, GiB, or a simple integer
                                            // (optional, omit key or set as 0 to skip size verification)

    allowedContentTypes: [                  // optional mime type filter if key is set
        "text/plain"
    ],
    allowedExtensions: [                    // optional extension filter if key is set
        "txt"
    ],
    sysKey: "your-16-bytes-aes-key"         // the AES key to use
}
```

### As object, as config file?

You can pass this configuration directly to the `init()` method, or save it under a json file (like other json config files used in Loopback).

Add the file in your `server` directory, named `storage.NODE_ENV.json`:

```json
{
    "secureStorageConfig": {
        "name": "secureStorageConfig",      // Loopback container name
        "root": ...
    }
}
```

**Note:** You do not have to create the "root" directory, if it does not exists, then the module will do the job when the app starts.

## Usage

```js
const SecureStorage = require('loopback-secure-storage');

// using a configuration object
SecureStorage.init({...});

// or... using a configuration file
SecureStorage.init('secureStorageConfig');

// write and read a file
SecureStorage.writeFile('myFile.txt', 'data to be written')
    .then(() => SecureStorage.readFile('myFile.txt'))
    .then(readData => console.log(readData));

// or use it as a server method
app.post('/uploadFile', (req, res) => {
    SecureStorage.uploadFile({req}, (err, fileObj) => {
        console.log('Saved', fileObj)
    });
});

// download file
// 'res' object from express will be filled with data and headers to be sent back to the client
app.get('/downloadFile', (req, res) => {
    SecureStorage.downloadFile('file-unique-name', res);
});
```

## Key management

To generate a key, you can use the `getRandomKey` method provided with the package as:

```js
const SecureStorage = require('loopback-secure-storage');
const key = SecureStorage.getRandomKey().hex;

// ... expected output:
// { bytes: [ 212, 202, 144, 124, 187, 170, 143, 47, 14, 139, 30, 72, 72, 165, 148, 68 ],
//   hex: 'd4ca907cbbaa8f2f0e8b1e4848a59444' }
```

## Testing

Module can be tested with `mocha`:

```bash
npm run test

SecureStorage
    before test: cleanup
      ✓ should cleanup temporary storage directory
    main functions
      #getRandomKey
        ✓ should return a 16 bytes random key
      #init
        ✓ should initialise properly without crashing
      #writeFile<Promise>
        ✓ should write encrypted file without error (promise)
      #readFile<Promise>
        ✓ should read previously written file without error (promise)
      #deleteFile<Promise>
        ✓ should delete previously written file without error (promise)
      #writeFile(err)
        ✓ should write encrypted file without error (callback)
      #readFile(err, data)
        ✓ should read previously written file without error (callback)
      #deleteFile(err, deleted)
        ✓ should delete previously written file without error (callback)
    server functions
      ✓ should be able to upload and encrypt a file (42ms)
      ✓ should be able to download a decrypted file
      ✓ should not be able to upload a file with a wrong extension
      ✓ should not be able to upload a file with a wrong mime type
      ✓ should not be able to upload a file with data size that exceeds the config limit
    util functions
      #asKiB
        ✓ should convert bytes to kibibytes properly
      #asMiB
        ✓ should convert bytes to mebibytes properly
      #asGiB
        ✓ should convert bytes to gibibytes properly
    after test: cleanup
      ✓ should cleanup temporary storage directory

```
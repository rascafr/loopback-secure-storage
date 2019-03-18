# loopback-secure-storage
Secure (AES) file system storage component for Loopback / IBM API ORM

## Features

- AES encryption / decryption
- HTTP upload / download support methods (express-compatible)
- 128bits key support (generate / use / check)
- compatible with Loopback's storage component (usage, config)

## Configuration

You must add a file in your `server` directory to handle secure storage settings, named `storage.NODE_ENV.json`:

```js
"secureStorageConfig": {
    "name": "secureStorageConfig",          // Loopback container name
    "root": "./storage/uploadedPdfDocs",    // The storage root directory (project root reference)
    "nameMakeUnique": true,                 // if the uploaded file will be renamed to prevent collisions
    "maxFileSize": 52428800,                // maximum accepted file size in bytes
    "allowedContentTypes": ["application/pdf"],     // allowed MIME document types
    "sysKey": "ee822309e831fd787ad808a90d8fb03e"    // the AES key to use
}
```

## Key management

To generate a key, you can use the `aes` sub-library provided with the package as:

```js
const AES = require('./lib/aes');
const keys = AES.genKey128()

// ... expected output:
// { bytes: [ 212, 202, 144, 124, 187, 170, 143, 47, 14, 139, 30, 72, 72, 165, 148, 68 ],
//   hex: 'd4ca907cbbaa8f2f0e8b1e4848a59444' }

```

## Methods

Documentation coming soon...

- `SecureStorage.secureReadFileData`
- `SecureStorage.secureWriteFileData`
- `SecureStorage.secureDeleteFileData`
- `SecureStorage.saveAsEncryptedHTTPFile`
- `SecureStorage.streamAsDecryptedHTTPFile`
- `SecureStorage.readAsDecryptedBytes`
- `SecureStorage.secureDelete`
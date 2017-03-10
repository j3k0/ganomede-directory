# Ganomede Directory NodeJS Client Library

## Getting started

```sh
npm install ganomede-directory
```

```js
var directory = require('ganomede-directory');
const directoryClient = directory.createClient();
directory.byAlias({type: 'tag', value: 'bobxyz'}, (err, account) => {
  // ...
});
```

## Directory Client

### directory.createClient(options)

Returns a directoryClient, see below for its interface.

Options:
 - `host` - default to env var `DIRECTORY_PORT_8000_TCP_ADDR`
 - `port` - default to env var `DIRECTORY_PORT_8000_TCP_PORT`
 - `protocol` - default to env var `DIRECTORY_PORT_8000_TCP_PROTOCOL`
 - `apiSecret` - default to env var `API_SECRET`
 - `log` - a bunyan logger, will create one for you if not specified

### directoryClient.authenticate
### directoryClient.addAccount
### directoryClient.byId
### directoryClient.byAlias
### directoryClient.byToken
### directoryClient.editAccount

## Authdb Client

For migrating legacy modules that were using the authdb redis database directly, we provide a compatible interface

### directory.createAuthdbClient(options)

Same arguments as `directory.createClient` (see above).

Returns a authdbClient (see below).

### authdbClient.getAccount(token, (err, account) => {})

An object with the following fields:

 - `account.username = id`
 - `account[alias.key] = alias.value`, for all aliases

### authdbClient.addAccount(token, account, (err, result) => {})

Expects `account.username` to be filled. Requires `apiSecret` in the options.

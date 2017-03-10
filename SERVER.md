# Ganomede Directory Server

Configuration
-------------

 * `COUCH_DIRECTORY_PORT_5984_TCP_ADDR` - IP of the directory couchdb, defaults to `'localhost'`;
 * `COUCH_DIRECTORY_PORT_5984_TCP_PORT` - Port of the directory couchdb, defaults to `5984`;
 * `COUCH_DIRECTORY_DB_NAME` — name of couch database, defaults to `'ganomede_directory_test'`;
 * `COUCH_DIRECTORY_VIEW_NAME` — name of couch db design to use (source only needs 1 design atm, but in case multiple are needed, we'll need to rethink this);
 * `COUCH_DIRECTORY_SYNC` — sync design document, trigger view recalculation and exit:
   - on process start, we check that design document in database matches the one source code expects. In case this isn't true, app fails to start. To fix the situation, set this env var to any value, start process as usual, wait for it to exit cleanly and restart with this env var unset.
 * `REDIS_AUTH_PORT_6379_TCP_ADDR` - IP of the AuthDB redis
 * `REDIS_AUTH_PORT_6379_TCP_PORT` - Port of the AuthDB redis
 * `API_SECRET` - Give access to private APIs
 * `LOG_LEVEL` - See [bunyan levels](https://github.com/trentm/node-bunyan#levels) (default: info)

Data structures
---------------

### User

A user has:

 * a single, static user **id**
 * a list of **aliases**, each containing:
   * date **created**
   * a **type**
   * a **value**
   * a **public** status
 * a **hash** encoded password
 * a set of authentication **tokens**
   * each with an expiry date

### Constraints

 * it's not possible remove an **alias** from a user.
   * it is forever reserved and linked with the user.
 * **id**, individual **aliases** and individual **tokens** have to be globally unique.
   * here, by **aliases** I mean tuples **(type, value)**.

### More on aliases

Whereas the directory contains the history of all aliases linked to a user, this shouldn't be a public information. Moreover, we wouldn't want some of the aliases, storing things like user emails or facebook ids, to be visible to anyone but the system and the user itself.

As such:

 * aliases with **public** property !== true will only be exported to:
   * calls requiring the **api secret**.
   * calls requiring the **auth token**.
 * all public calls (i.e. those not used for administration purpose) will expose the aliases as a map **type** &rArr; **value**.
   * the **value** exposed for each **type** is the last one that was added (based on the **created** property).

# Relations

 * For password hashing:
    * https://github.com/florianheinemann/password-hash-and-salt
 * CouchDB:
    * One document per user (using the user's id)
    * Views to map aliases to a user.
 * AuthDB:
    * For authentication tokens (a map **token** &rArr; **{username: id}**)
      * Because implementing expiry with Redis is nice and easy.
      * Also to keep compatibility with the existing services who expect direct access to a Redis authDB database.

API
===

List of all users [/directory/v1/users]
---------------------------------------

## Add a user [POST]

### body (application/json)

```json
{
    "secret": "api-secret",
    "id": "hrry23",
    "password": "user-password",
    "aliases": [{
        "type": "email",
        "value": "harry123@email.com"
    }, {
        "public": true,
        "type": "name",
        "value": "HariCo"
    }]
}
```

### response [400] Bad request

When:

 * `BadUserId` missing or anything other than non-empty string;
 * `BadPassword` password is missing or too short (less than 8 characters);
 * `BadAliases` invalid aliases format (`type` and `email` are not non-empty strings, `public` present but not boolean).

### response [409] Conflict

When:

 * `UserAlreadyExistsError` user id is already taken
 * `AliasAlreadyExistsError` one of the provided aliases is not available

### response [200] OK

```json
{
    "id": "hrry23"
}
```

Users indexed by id [/directory/v1/users/id/:id]
------------------------------------------------

The user with the given `id`.

There cannot be more than 1 match (because user ids are globally unique).

## Retrieve a user [GET]

### response [200] OK

```json
{
    "id": "hrry23",
    "aliases": {
        "name": "Harry"
    }
}
```

### response [400] Bad Request

  * `BadUserId` missing or anything other than non-empty string;


### response [404] Not Found

  * `UserNotFoundError` no user with such id

_note: this call only exposes public aliases_

## Edit a user [POST]

### body (application/json)

To add aliases:

```json
{
    "secret": "api_secret",
    "aliases": [{
        "type": "email",
        "value": "harry123@email.com"
    }]
}
```

To change the password:

```json
{
    "secret": "api_secret",
    "password": "my-new-password"
}
```

### Response [401] Not Authorized

 * `NotAuthorized` Invalid / missing secret.

### Response [400] Bad Request

 * `BadUserId` missing or anything other than non-empty string;


 * when chaning password:
   * `BadPassword` password is missing or too short (less than 8 characters);

 * when adding alias:
  * `BadAliases` invalid aliases format (`type` and `email` are not non-empty strings, `public` present but not boolean).

 * `BadEditMethod` missing `password` or `aliases`, or both are present at the same time.

### Response [404] Not Found

 * `UserNotFoundError` no user with such id

User auth tokens [/directory/v1/users/auth]
-------------------------------------------

## Create a new auth token [POST]

Or, like some people call this, login.

### body (application/json)

```json
{
    "id": "happrr",
    "password": "my-password"
}
```

**Notes**:
 - `API_SECRET` is also considered a valid password
 - it's possible to specify your own value for `token`: add a `token` field in the request body

### response [200] OK

```json
{
    "id": "hrry23",
    "token": "an-authentication-token"
}
```


### Response [401] Not Authorized

 * `InvalidCredentialsError` Invalid user id + password pair.

### Response [404] Not Found

 * `UserNotFoundError` no user with such id

### Response [400] Bad Request

 * `BadUserId` missing or anything other than non-empty string;
 * `BadPassword` password is missing or too short (less than 8 characters);

User indexed by auth token [/directory/v1/users/auth/:token]
------------------------------------------------------------

## Retrieve a user [GET]

Return the user for which `auth_token` is in `user.auth_tokens`. Their should be at most 1 match.

There cannot be more than 1 match (auth tokens are globally unique).

### response [200] OK

```json
{
    "id": "hrry23",
    "aliases": {
        "name": "Harry",
        "email": "harry123@email.com",
        "facebook": "12012484843"
    }
}
```

InvalidAuthTokenError
### Response [401] Not Authorized

 * `InvalidAuthTokenError` missing / invalid token

### Response [404] Not Found

 * `UserNotFoundError` token resolved to user id which was not found.

### Response [400] Bad Request

 * `BadUserId` missing or anything other than non-empty string;

_note: this call exposes both public and private aliases_

User indexed by alias [/directory/v1/users/alias/:type/:value]
--------------------------------------------------------------

## Retrieve a user [GET]

Return the user for which `(type, value)` is in `user.aliases`.

There cannot be more than 1 match (aliases are contrained to be globally unique).

### response [200] OK

```json
{
    "id": "hrry23",
    "aliases": {
        "name": "Harry"
    }
}
```

### Response [404] Not Found

 * `UserNotFoundError` alias resolved to user id which was not found.

### Response [400] Bad Request

 * `BadAlias` type or value, or both are something other than non-empty string;

_note: this call exposes only public aliases_


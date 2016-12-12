# ganomede-directory

Directory of users microservice

Overview
--------

The microservice allows to manage users:

 * create
 * find by `id`
 * find by `token`
 * find by `alias`
 * authenticate
 * change password
 * add a alias

Configuration
-------------

 * `COUCH_DIRECTORY_PORT_5984_TCP_ADDR` - IP of the directory couchdb
 * `COUCH_DIRECTORY_PORT_5984_TCP_PORT` - Port of the directory couchdb
 * `REDIS_AUTH_PORT_6379_TCP_ADDR` - IP of the AuthDB redis
 * `REDIS_AUTH_PORT_6379_TCP_PORT` - Port of the AuthDB redis
 * `API_SECRET` - Give access to private APIs

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
    * For authentication tokens (a map **token** &rArr; **user id**)
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

 * password isn't safe enough:
   * too short: less than 8 characters

### response [409] Conflict

When:

 * user id is already taken
 * one of the provided aliases is not available

### response [200] OK

```json
{
    "id": "hrry23",
    "token": "an-authentication-token"
}
```

## Retrieve all users [GET]

### get parameters

 * `api_secret`: should be equal to env variable `API_SECRET`
 * `limit`: max number of users to retrieve
 * `offset`: offset used for pagination

### response [200] OK

```json
{
    "id": "hrry23",
    "aliases": [
        [1481436006, "email", "harry123@email.com"],
        [1481436006, "name", "HariCo"],
        [1481471231, "name", "Harry"],
        [1481512304, "facebook", "12012484843"]
    ],
    "hash": "long-crypto-level-string-encoding-the-password"
}
```

 * For password hashing:
    * https://github.com/florianheinemann/password-hash-and-salt


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
        "name", "Harry"
    }
}
```

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

### response [200] OK

```json
{
    "id": "hrry23",
    "token": "an-authentication-token"
}
```

### response [401] Unauthorized

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
        "name", "Harry",
        "email": "harry123@email.com",
        "facebook", "12012484843"
    }
}
```

_note: this call exposes both public and private aliases_

User indexed by alias [/directory/v1/users/alias/:type/:value]
--------------------------------------------------------------

## Retrieve a user [GET]

Return the user for which `(type, value)` is in `user.aliases`.

There cannot be more than 1 match (aliases are contrained to be globally unique).

### response [200] OK

```json
{
    "user_id": "hrry23",
    "aliases": {
        "name", "Harry"
    }
}
```

_note: this call exposes only public aliases_

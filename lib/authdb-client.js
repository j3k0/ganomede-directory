const createClient = require('./client').createClient;

const createAuthdbClient = (options) => {
  const client = createClient(options);
  const apiSecret = options.apiSecret || process.env.API_SECRET;
  return {

    getAccount: (token, callback) => {
      client.byToken({token}, (err, account) => {
        if (err)
          return callback(err);
        let result = {username: account.id};
        for (let key in (account.aliases || {}))
          result[key] = account.aliases[key];
        callback(null, result);
      });
    },

    addAccount: (token, account, callback) => {
      const id = account.username;
      const password = apiSecret;
      client.authenticate({id, token, password}, (err, result) => {
        callback(err, result && result.token);
      });
    }
  };
};

module.exports = {createAuthdbClient};

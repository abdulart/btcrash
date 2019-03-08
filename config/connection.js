const monk = require('monk');
const db = monk('localhost/local');

module.exports = db;
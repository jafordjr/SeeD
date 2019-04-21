const assert = require("assert");
const config = require("./config");
const mysql = require("mysql");
let _db;

/*var con = mysql.createConnection({
    host: "sql9.freemysqlhosting.net",
    user: "sql9285483",
    password: "qUusJhQ7zc",
    database: "sql9285483"
});


con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});*/

function initDb(callback) {
    if (_db) {
        console.warn("Trying to init DB again!");
        return callback(null, _db);
    }
    var db = mysql.createConnection(config.db.connectionString);
    /*var db = mysql.createConnection({
        host: "sql9.freemysqlhosting.net",
        user: "sql9285483",
        password: "qUusJhQ7zc",
        database: "sql9285483"
    });*/
    db.connect(function (err) {
        if (err) {
            return callback(err);
        }
    });
    //console.log("DB initialized - connected to: " + config.db.connectionString.split("@")[1]);
    console.log("DB initialized - connected to: ");
    _db = db;
    return _db;
}

function getDb() {
    assert.ok(_db, "Db has not been initialized. Please called init first.");
    return _db;
}

module.exports = {
    getDb,
    initDb
};
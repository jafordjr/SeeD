'use strict';
// Packages
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var http = require('http');
var router = express.Router();
const initDb = require("./helper.js").initDb;
const getDb = require("./helper.js").getDb;
var mysql = require('mysql');
initDb(function () { });

var routes = require('./routes/index');
var admin = require('./routes/admin');
var client = require('./routes/client');
var users = require('./routes/users');

// Indicate server is started - Useful for commandline
console.log("Nodejs Server started!");


const con = getDb();
con.query("Select * FROM users", function (err, result) {
    if (err) { throw err };
    console.log(result);
}
);

var app = express();
// view engine setup
app.locals.basedir = path.join(__dirname, 'views');
app.locals.moment = require('moment');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: "rickyBobby"
}));
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function isAdmin(req, res, next) {
    if (typeof req.session.user !== 'undefined') {
        if (req.session.user.role !== 'admin') { res.redirect('/'); }
        else { next(); }
    }
    else { res.redirect('/login'); }
}
function isClient(req, res, next) {
    if (typeof req.session.user !== 'undefined') {
        if (req.session.user.role !== 'client' && req.session.user.role !== 'admin') { res.redirect('/'); }
        else { next(); }
    }
    else { res.redirect('/login'); }
}

app.use('/admin', isAdmin, admin);
app.use('/cloud', express.static(__dirname + '/node_modules/jqcloud2/'));
//app.use('/admin', admin);
app.use('/client', isClient, client);
//app.use('/client', client);
app.use('/', routes);
app.get('/login', function (req, res, next) { if (req.session.user == null) { next(); } }, function (req, res, next) { res.render('login', { title: 'Login' }) })
app.post('/login', function (req, res, next) {
    con.query("SELECT * FROM users WHERE username = '" + req.body.username + "' LIMIT 1", function (err, result) {
        if (err) { throw err };
        if (result.length !== 0) {
            if (result[0].password === req.body.password) {
                req.session.user = { name: result[0].name, role: result[0].role, id: result[0].id };
                res.redirect('/');
            }
            else { res.render('login', { user: req.session.user, title: 'Login', error: 'wrong password' }); }
        }
        else { res.render('login', { user: req.session.user, title: 'Login', error: 'user does not exist' }); }
    });
});
app.get('/signUp', function (req, res, next) { if (req.session.user == null) { next(); } }, function (req, res, next) { res.render('signUp', { title: 'Sign Up' }); });
app.post('/signUp', function (req, res, next) {
    con.query("SELECT * FROM users WHERE username = ? LIMIT 1", [req.body.username], function (err, result, fields) {
        if (err) { console.trace(); throw err }
        if (result.length !== 0) {
            res.render('signUp', { user: req.session.user, title: 'Sign Up', error: 'User already exists' })
        }
        else {
            con.query("INSERT into users VALUES (?,?,?,?,?)", [null, req.body.username, req.body.password, 'client', req.body.name], function (err, result) {
                if (err) { throw err; }
                res.render('login', { user: req.session.user, title: 'Login', error: 'Sucess, Please login' })
            });
        }
    });
});
app.get('/logout', function (req, res, next) { req.session.user = null; res.redirect('/'); });
//app.use('/users', usersRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

module.exports = con;
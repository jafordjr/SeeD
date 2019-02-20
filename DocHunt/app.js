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
var mysql = require('mysql');

// Indicate server is started - Useful for commandline
console.log("Nodejs Server started!");

// Connection information for sql database
var con = mysql.createConnection({
    host: "sql9.freemysqlhosting.net",
    user: "sql9279950",
    password: "AHGNlNK3kj",
    database: "sql9279950"
});

// Attempting to connect to sql database
con.connect(function (err) {
    if (err) throw err;
    console.log("Sql Connected!");
});

// Routing for Users and Individuals
var routes = require('./routes/index');
var users = require('./routes/users');

// Attaching express generator to App
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Routing all paths to "routes" 
app.use('/', routes);
//Routing "users" path to "users" -- yes this is negated by above.
app.use('/users', users);

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

// Setting port for the application
app.set('port', process.env.PORT || 3000);

// Starting node js express
var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

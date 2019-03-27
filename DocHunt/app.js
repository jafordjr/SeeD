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
//var formidable = require('formidable'); //for uploading documents
//var fs = require('fs');
//var MongoClient = require('mongodb').MongoClient;
//var url = "mongodb://localhost:27017/mydb";
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');

var routes = require('./routes/index');
var admin = require('./routes/admin');
var client = require('./routes/client');
var users = require('./routes/users');

// Indicate server is started - Useful for commandline
console.log("Nodejs Server started!");

var con = mysql.createConnection({
    host: "sql9.freemysqlhosting.net",
    user: "sql9285483",
    password: "qUusJhQ7zc",
    database: "sql9285483"
});


con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});



/*//shitty function for uploading a doc and saving to local folder, no integration with mongoDB yet 
http.createServer(function (req, res) {
  if (req.url == '/fileupload') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path;
      //change this ish to whatever your filepath is
      var newpath = '/home/david/Desktop/SeeD-master/testfiles/' + files.filetoupload.name;
      var dbValue = [newpath, files.filetoupload.name];
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;

        res.write('File uploaded and moved!');
        res.end();
      });
 });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
  }
}).listen(8080); 

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
    db.close();
}); */

// Attaching express generator to App
var app = express();
//var users = [['testCust1', 'testCust1P', 'Johnny Smity', 'client'], ['testMana1', 'testMana1P', 'Ricky Bobby', 'admin']];

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
        if (req.session.user.role !== 'client') { res.redirect('/'); }
        else { next(); }
    }
    else { res.redirect('/login'); }
}

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
        if (err) { throw err }
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
app.use('/admin', isAdmin, admin);
app.use('/client', isClient, client);
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
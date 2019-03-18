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
var formidable = require('formidable'); //for uploading documents
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";

// Indicate server is started - Useful for commandline
console.log("Nodejs Server started!");

//shitty function for uploading a doc and saving to local folder, no integration with mongoDB yet 
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

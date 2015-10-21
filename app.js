var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var user = require('./routes/user');
var event = require('./routes/event');
var calendar = require('./routes/calendar');
var sync = require('./routes/sync');
var mongo = require('mongodb').MongoClient;
var fs = require('fs');

var app = express();

// TODO: Hackish
express.response.err400 = require('./util').err400;
require('mongodb').Cursor.prototype.paginate = require('./util').paginate;

// Set up DB connection
var url = 'mongodb://localhost:27017/mcc';
var db;
mongo.connect(url, function (err, connectedDb) {
  if (err !== null) {
    console.log("Error connecting to database");
    console.log(err);
  } else {
    console.log("Connected to database");
  }
  db = connectedDb;
});

// Make DB accessible to router
app.use(function (req, res, next) {
  req.db = db;
  next();
});

// Load client secrets from file and make accessible to router
app.use(function (req, res, next) {
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    req.clientSecrets = JSON.parse(content);
  });
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/user', user);
app.use('/event', event);
app.use('/calendar', calendar);
app.use('/sync', sync);

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


module.exports = app;

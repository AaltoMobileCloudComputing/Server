var express = require('express');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(__dirname + "/html/index.html");
  //res.render('index', { title: 'Express' });
});

router.get('/event', function(req, res, next) {
  res.sendFile(__dirname + "/html/event.html");
  //res.render('index', { title: 'Express' });
});

router.get('/calendar', function(req, res, next) {
  res.sendFile(__dirname + "/html/calendar.html");
});


module.exports = router;

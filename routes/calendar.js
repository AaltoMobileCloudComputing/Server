var express = require('express');
var router = express.Router();

/* GET calendar listing. */
router.get('/', function(req, res, next) {
  res.json({calendars: ["calendar1", "calendar2"]});
});

router.get('/:id', function(req, res, next) {
  res.json({calendar: {id: req.params.id}});
});

module.exports = router;

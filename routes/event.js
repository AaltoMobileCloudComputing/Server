var express = require('express');
var router = express.Router();

/* GET event listing. */
router.get('/', function(req, res, next) {
  res.json({events: ["event1", "event2"]});
});

router.get('/:id', function(req, res, next) {
  res.json({event: {id: req.params.id}});
});

module.exports = router;

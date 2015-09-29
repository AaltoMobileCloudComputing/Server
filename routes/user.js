var express = require('express');
var router = express.Router();

/* GET user listing. */
router.get('/', function(req, res, next) {
  res.json({users: ["user1", "user2"]});
});

router.get('/:id', function(req, res, next) {
  res.json({user: {id: req.params.id}});
});

module.exports = router;

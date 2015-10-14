var express = require('express');
var router = express.Router();
var util = require('../util');

// TODO: Implement
function parseQueryParams(req) {
  return {};
}

/*
 * GET
 */
router.get('/', function (req, res) {
  var collection = req.db.collection('calendars');
  var query = parseQueryParams(req);
  collection.find(query).paginate(req.query.limit, req.query.offset).toArray(function (err, calendars) {
    res.json(calendars);
  });
});

router.get('/:id', function (req, res) {
  var id = util.convertID(req.params.id);
  var collection = req.db.collection('calendars');
  util.findOne(id, collection).then(function (event) {
    res.json(event);
  }).catch(
    //res.err400 <-- does not work for some reason; method gets called but no response is set
    function (error) {
      res.err400(error);
    }
  );
});

/*
 * POST
 */
router.post('/', function (req, res) {
  var userID = util.convertID(req.body.user); // TODO: userID could be inferred from API token
  util.findOne(userID, req.db.collection('users')).then(
    function() {
      var title = req.body.title;
      if (!title) {
        throw new Error('Title must be non-empty');
      }
      var calendar = {
        title: title,
        description: req.body.description || ''
      };

      return util.insertOne(calendar, req.db.collection('calendars')).then(function() {
        return util.updateOne(userID, req.db.collection('users'), {$addToSet: {calendars: calendar._id}});
      }).then(function () {
        return res.json(calendar);
      });
    }
  ).catch(
    //res.err400 <-- does not work for some reason; method gets called but no response is set
    function (error) {
      res.err400(error);
    }
  );
});

router.post('/:id', function (req, res) {
  var calendarUpdate = {};
  var id = util.convertID(req.params.id);

  if (req.body.title) calendarUpdate.title = req.body.title;
  if (req.body.description) calendarUpdate.description = req.body.description;

  util.updateOne(id, req.db.collection('calendars'), calendarUpdate).then(
    function(updated) {
      return res.json(updated.value);
    }
  ).catch(
    function (error) {
      res.err400(error);
    }
  )
});

router.post('/share/:id/:userid', function (req, res) {
  // TODO need to decide that is this sesiple or should post json be used
  util.auth(req, function(user){
    if (user == null) return res.err400("Unvalid token");

    var id = req.params.id;
    var userID = req.params.userid;

    if (userID == user._id) return res.err400("User already has access to calendar");
    else if (util.idInList(id, user.calendars)) {
      var collection = req.db.collection('users');
      collection.update({_id: util.convertID(userID)}, {$addToSet: {calendars: util.convertID(id)}}, function (err, result) {
        if (result == null) {
          return res.err400('Unvalid user');
        }
        else {
          res.json(result);
        }
      });
    }
    else return res.err400("Unvalid token");
  });
});

/*
 * DELETE
 */
router.delete('/:id', function (req, res) {
  var id = util.convertID(req.params.id);
  var calendars = req.db.collection('calendars');
  util.deleteOne(id, calendars).then(
    function() {
      req.db.collection('events').deleteMany({calendar: id}, function(err, result) {
        res.json(result);
      });
    }
  ).catch(
    function (error) {
      res.err400(error);
    }
  );
});

module.exports = router;

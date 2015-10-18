var express = require('express');
var router = express.Router();
var util = require('../util');

function parseQueryParams(req, user) {
  return {_id: {$in: user.calendars}};
}

/*
 * GET
 */
router.get('/', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var collection = req.db.collection('calendars');
    var query = parseQueryParams(req, user);
    collection.find(query).paginate(req.query.limit, req.query.offset).toArray(function (err, calendars) {
      res.json(calendars);
    });
  });

});

router.get('/:id', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var id = util.convertID(req.params.id);
    var collection = req.db.collection('calendars');
    util.findOneWithQuery({_id: id, _id: {$in: user.calendars}}, collection).then(function (event) {
      res.json(event);
    }).catch(
      function (error) {
        res.err400(error);
      }
    );
  });

});

/*
 * POST
 */
router.post('/', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    util.findOne(user._id, req.db.collection('users')).then(
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
          return util.updateOne(user._id, req.db.collection('users'), {$addToSet: {calendars: calendar._id}});
        }).then(function () {
          return res.json(calendar);
        });
      }
    ).catch(
      function (error) {
        res.err400(error);
      }
    );
  });
});

router.post('/share', function (req, res) {
  util.auth(req, function(user){
    if (user == null) return res.err400("Invalid token");
    if (!req.body.id || !req.body.userid) return res.err400("Calendar id or user id missing");
    var id = req.body.id;
    var userID = req.body.userid;

    if (userID == user._id) return res.err400("User already has access to calendar");
    else if (util.idInList(id, user.calendars)) {
      var collection = req.db.collection('users');
      collection.update({_id: util.convertID(userID)}, {$addToSet: {calendars: util.convertID(id)}}, function (err, result) {
        if (result == null) return res.err400('Invalid user');
        else res.json(result);
      });
    }
    else return res.err400("Invalid token");
  });
});

router.post('/:id', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var calendarUpdate = {};
    var id = util.convertID(req.params.id);

    if (req.body.title) calendarUpdate.title = req.body.title;
    if (req.body.description) calendarUpdate.description = req.body.description;

    util.updateOneWithQuery({_id: id, _id: {$in: user.calendars}}, req.db.collection('calendars'), calendarUpdate).then(
      function(updated) {
        return res.json(updated.value);
      }
    ).catch(
      function (error) {
        res.err400(error);
      }
    )
  });
});



/*
 * DELETE
 */
router.delete('/:id', function (req, res) {
  util.auth(req, function(user){
    if (user == null) return res.err400("Invalid token");
    var id = util.convertID(req.params.id);
    var calendars = req.db.collection('calendars');
    util.deleteOneWithQuery({_id: id, _id: {$in: user.calendars}}, calendars).then(
      function() {
        req.db.collection('events').deleteMany({calendar: id, calendar: {$in: user.calendars}}, function(err, result) {
          res.json(result);
        });
      }
    ).catch(
      function (error) {
        res.err400(error);
      }
    );
  });

});

module.exports = router;

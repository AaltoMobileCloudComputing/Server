var express = require('express');
var router = express.Router();
var util = require('../util');

function parseQueryParams(req, user) {
  var query = {"calendar": {$in: user.calendars}}
  if (req.query.start && req.query.end) {
    var start = util.convertTime(req.query.start);
    var end = util.convertTime(req.query.end);
    query.$or = [];
    query.$or.push({start: {$gte: start, $lt: end}});
    query.$or.push({end: {$gte: start, $lt: end}});
  }
  else if (req.query.start) {
    var start = util.convertTime(req.query.start);
    query.$or = [];
    query.$or.push({start: {$gte: start}});
    query.$or.push({end: {$gte: start}});
  }
  else if (req.query.end) {
    var end = util.convertTime(req.query.end);
    query.$or = [];
    query.$or.push({start: {$lt: end}});
    query.$or.push({end: {$lt: end}});
  }
  if (req.query.search) {
    query.title = {$regex : ".*" + req.query.search + ".*"};
  }
  return query;
}

function insertChange(userId, eventId, type, db) {
  return util.insertOne({user: util.convertStrToId(userId), event: util.convertStrToId(eventId), type: type}, db.collection('changes'))
}

/*
 * GET
 */
router.get('/', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var collection = req.db.collection('events');
    var query = parseQueryParams(req, user);
    collection.find(query).paginate(req.query.limit, req.query.offset).toArray(function (err, events) {
      console.log(events);
      res.json(events);
    });
  });
});

router.get('/:id', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var id = util.convertStrToId(req.params.id);
    var collection = req.db.collection('events');
    util.findOneWithQuery({_id: id, calendar: {$in: user.calendars}}, collection).then(function (event) {
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
    var calendarId = util.convertStrToId(req.body.calendar) || user.primary; // User primary calendar by default
    if (util.idInList(calendarId, user.calendars)) return res.err400("Calendar not accessible");
    util.findOne(calendarId, req.db.collection('calendars')).then(
      function() {
        var title = req.body.title;
        if (!title) {
          throw new Error('Title must be non-empty');
        }
        var times = util.convertTimes(req.body.start, req.body.end);
        var event = {
          calendar: calendarId,
          title: title,
          description: req.body.description || '',
          start: times.start,
          end: times.end
        };
        return util.insertOne(event, req.db.collection('events')).then(function() {
          if (calendarId.equals(user.primary) && user.syncinitialized) {
            return insertChange(user._id, event._id, 'insert', req.db).then(
                function() {
                  res.json(event)
                }
            );
          }
          res.json(event);
        })
      }
    ).catch(
        function (error) {
          res.err400(error);
        }
    );
  });
});

router.post('/:id', function (req, res) {
  util.auth(req, function(user){
    if (user == null) return res.err400("Invalid token");
    var eventUpdate = {};
    var id = util.convertStrToId(req.params.id);
    var events = req.db.collection('events');
    util.findOne(id, events).then(
      function (eventOriginal) {
        if (req.body.title) eventUpdate.title = req.body.title;
        if (req.body.description) eventUpdate.description = req.body.description;

        var times = util.convertTimes(req.body.start || eventOriginal.start, req.body.end || eventOriginal.end);
        eventUpdate.start = times.start;
        eventUpdate.end = times.end;
        if (req.body.calendar) {
          var calendarId = util.convertStrToId(req.body.calendar);
          var calendars = req.db.collection('calendars');
          return util.findOne(calendarId, calendars).then(function () {
            eventUpdate.calendar = calendarId;
          })
        }
      }
    ).then(
      function() {
        return util.updateOneWithQuery({_id: id, calendar: {$in: user.calendars}}, events, {$set: eventUpdate}).then(
            function (updated) {
              if (updated.value.calendar.equals(user.primary) && user.syncinitialized) {
                return insertChange(user._id, id, 'update', req.db).then(
                    function() {
                      res.json(updated.value)
                    }
                );
              }
              return res.json(updated.value);
            }
        );
      }
    ).catch(
      function (error) {
        res.err400(error);
      }
    );
  });
});

/*
 * DELETE
 */
router.delete('/:id', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var id = util.convertStrToId(req.params.id);
    var events = req.db.collection('events');
    util.deleteOneWithQuery({_id: id, calendar: {$in: user.calendars}}, events).then(
        function (result) {
          if (result.value.calendar.equals(user.primary) && user.syncinitialized) {
            return insertChange(user._id, id, 'delete', req.db).then(
                function() {
                  res.json(result.value)
                }
            );
          } else {
            return res.json(result.value);
          }
        }
    ).catch(
        function (error) {
          return res.err400(error.message);
        }
    );
  });
});

module.exports = router;

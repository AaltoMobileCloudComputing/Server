var express = require('express');
var router = express.Router();
var util = require('../util');

// TODO: Implement
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

/*
 * GET
 */
router.get('/', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Unvalid token");
    var collection = req.db.collection('events');
    var query = parseQueryParams(req, user);
    console.log(query);
    collection.find(query).paginate(req.query.limit, req.query.offset).toArray(function (err, events) {
      res.json(events);
    });
  });
});

router.get('/:id', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Unvalid toke");
    var id = util.convertID(req.params.id);
    var collection = req.db.collection('events');
    util.findOneWithQuery({_id: id, calendar: {$in: user.calendars}}, collection).then(function (event) {
      res.json(event);
    }).catch(
      //res.err400 <-- does not work for some reason; method gets called but no response is set
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
    var calendarId = util.convertID(req.body.calendar);
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
          end: times.end,
        };
        return util.insertOne(event, req.db.collection('events')).then(function() {
          res.json(event);
        })
      }
    ).catch(
        //res.err400 <-- does not work for some reason; method gets called but no response is set
        function (error) {
          res.err400(error);
        }
    );
  });
});

router.post('/:id', function (req, res) {
  // TODO add auth()
  var eventUpdate = {};
  var id = util.convertID(req.params.id);
  var events = req.db.collection('events');
  util.findOne(id, events).then(
    function (eventOriginal) {
      if (req.body.title) eventUpdate.title = req.body.title;
      if (req.body.description) eventUpdate.description = req.body.description;

      var times = util.convertTimes(req.body.start || eventOriginal.start, req.body.end || eventOriginal.end);
      eventUpdate.start = times.start;
      eventUpdate.end = times.end;
      if (req.body.calendar) {
        var calendarId = util.convertID(req.body.calendar);
        var calendars = req.db.collection('calendars');
        return util.findOne(calendarId, calendars).then(function () {
          eventUpdate.calendar = calendarId;
        })
      }
    }
  ).then(
    function() {
      return util.updateOne(id, events, {$set: eventUpdate}).then(function (updated) {
        return res.json(updated.value);
      });
    }
  ).catch(
    //res.err400 <-- does not work for some reason; method gets called but no response is set
    function (error) {
      res.err400(error);
    }
  );
});

/*
 * DELETE
 */
router.delete('/:id', function (req, res) {
  // TODO add auth()
  var id = util.convertID(req.params.id);
  var events = req.db.collection('events');
  util.deleteOne(id, events).then(
      function (result) {
        res.json(result.value);
      }
  ).catch(
      function (error) {
        return res.err400(error.message);
      }
  );
});

module.exports = router;

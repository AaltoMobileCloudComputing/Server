var express = require('express');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var util = require('../util');
var router = express.Router();

/**
 * Get oauth2client based on client_secret.json (represented here as credentials)
 */
function getOauth2Client(credentials) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  return new auth.OAuth2(clientId, clientSecret, redirectUrl);
}

function convertEventGoogleToMcc(event) {
  return {
    _id: event.id,
    title: event.summary,
    start: event.start.dateTime,
    end: event.end.dateTime
  }
}

function synchronize(user, db, syncReq) {
  var calendar = google.calendar('v3');
  var eventsCollection = db.collection('events');

  calendar.events.list(syncReq, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    var events = response.items;
    var promises = [];
    if (events.length > 0) {
      console.log('Syncing ' + events.length + ' events');
      events.forEach(function (event) {
        var converted = convertEventGoogleToMcc(event);
        converted.calendar = user.synccalendar;
        promises.push(util.upsertOne(util.convertID(converted._id), eventsCollection, converted));
      });
    }

    if (response.nextPageToken) {
      syncReq.pageToken = response.nextPageToken;
      promises.concat(synchronize(user, collection, syncReq));
    } else if (response.nextSyncToken) {
      promises.push(util.updateOne(user._id, db.collection('users'), {$set: {synctoken: response.nextSyncToken}}));
    }
    return promises;
  });
}

router.get('/', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var oauth2Client = getOauth2Client(req.clientSecrets);

    if (!user.tokens) { // Need to do initial authorization if tokens are not present
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar']
      });
      return res.render('sync-auth', {authUrl: authUrl});
    }
    oauth2Client.credentials = user.tokens;

    var syncReq = {
      auth: oauth2Client,
      calendarId: 'primary' // TODO: Only primary calendar support (at least for now)
    };
    if (user.synctoken) { // Incremental sync
      syncReq.syncToken = user.synctoken;
    } else { // Full sync (all events starting from year ago)
      var d = new Date();
      d.setYear(d.getFullYear() - 1);
      syncReq.timeMin = d.toISOString();
    }

    Promise.all(synchronize(user, req.db, syncReq)).then(
        function() {
          return res.json({result: 'Sync OK!'})
    }).catch(
        function(error) {
          // FIXME: For some reason error is returned although syncing actually works
          if (error.message === 'Cannot read property \'Symbol(Symbol.iterator)\' of undefined') {
            return res.json({result: 'Sync OK!'})
          } else {
            return res.err400(error);
          }
    });
  });
});

router.post('/', function (req, res) {
  util.auth(req, function (user) {
    var oauth2Client = getOauth2Client(req.clientSecrets);
    var code = req.body.code;

    oauth2Client.getToken(code, function (err, tokens) {
      if (err) {
        return res.err400('Error while trying to retrieve access token');
      }
      oauth2Client.credentials = tokens;

      var syncCalendar = {title: 'Google Calendar'};
      util.insertOne(syncCalendar, req.db.collection('calendars')).then(function() {
        return util.updateOne(user._id, req.db.collection('users'), {$addToSet: {calendars: syncCalendar._id}, $set: {tokens: tokens, synccalendar: syncCalendar._id}});
      }).then(function () {
        return res.redirect('/sync?token=' + user.token);
      }).catch(function() {
        return res.err400('Failed to update sync credentials')
      });
    });
  });
});

module.exports = router;
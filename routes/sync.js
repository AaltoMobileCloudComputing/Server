var express = require('express');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var util = require('../util');
var router = express.Router();

/**
 * HELPERS
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
    _id: util.convertStrToId(event.id),
    title: event.summary,
    description: event.description,
    start: new Date(event.start.dateTime || event.start.date),
    end: new Date(event.end.dateTime || event.end.date)
  }
}

function convertEventMccToGoogle(event) {
  return {
    id: util.convertIdToStr(event._id),
    summary: event.title,
    description: event.description,
    start: {dateTime: event.start.toISOString()},
    end: {dateTime: event.end.toISOString()}
  }
}

function copySyncReq(syncReq) {
  // It's better to copy the initially created syncReq than reuse the same because lingering parameters might cause
  // errors
  return {
    auth: syncReq.auth,
    calendarId: syncReq.calendarId,
    syncToken: syncReq.syncToken,
    timeMin: syncReq.timeMin,
    pageToken: syncReq.pageToken
  };
}

function getSyncReq(user, clientSecrets) {
  var oauth2Client = getOauth2Client(clientSecrets);

  if (!user.tokens) { // Need to do initial authorization if tokens are not present
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    });
    return {authUrl: authUrl};
  }
  oauth2Client.credentials = user.tokens;

  var syncReq = {
    auth: oauth2Client,
    calendarId: 'primary' // TODO: Only primary calendar support (at least for now)
  };
  if (user.nextsynctoken) { // Incremental sync
    syncReq.syncToken = user.nextsynctoken;
  } else { // Full sync (all events starting from year ago)
    var d = new Date();
    d.setYear(d.getFullYear() - 1);
    syncReq.timeMin = d.toISOString();
  }

  return syncReq;
}

function getEventApiPromise(syncReq, type) {
  return new Promise(function (resolve, reject) {
    google.calendar('v3').events[type](syncReq, function(err, event) {
      if(err !== null) return reject(err);
      resolve(event);
    });
  })
}

/**
 * SYNC
 */

function synchronizeMccToGoogleInitial(user, db, syncReq) {
  var eventsCollection = db.collection('events');
  var usersCollection = db.collection('users');

  return eventsCollection.find({calendar: user.primary}).toArray().then(
      function (events) {
        var syncResult = {
          promises: [],
          upserted: 0,
          deleted: 0
        };
        events.forEach(function (event) {
          var sr = copySyncReq(syncReq);
          sr.eventId = util.convertIdToStr(event._id);
          sr.resource = convertEventMccToGoogle(event);
          syncResult.upserted++;
          syncResult.promises.push(getEventApiPromise(sr, 'insert'));
        });
        syncResult.promises.push(util.updateOne(user._id, usersCollection, {$set: {syncinitialized: true}}));
        return syncResult;
      }
  );
}

function synchronizeMccToGoogle(user, db, syncReq) {
  if (!user.syncinitialized) return synchronizeMccToGoogleInitial(user, db, syncReq);

  var eventsCollection = db.collection('events');
  var changesCollection = db.collection('changes');

  return changesCollection.find({user: user._id}).toArray().then(
      function (changes) {
        var syncResult = {
          promises: [],
          upserted: 0,
          deleted: 0
        };
        changes.forEach(function (change) {
          var p;
          var sr = copySyncReq(syncReq);
          sr.eventId = util.convertIdToStr(change.event);
          switch (change.type) {
            case 'insert':
            case 'update':
              p = util.findOne(change.event, eventsCollection).then(
                  function(event) {
                    sr.resource = convertEventMccToGoogle(event);
                    return getEventApiPromise(sr, change.type);
                  }
              );
              syncResult.upserted++;
              break;
            case 'delete':
              p = getEventApiPromise(sr, 'delete');
              syncResult.deleted++;
              break;
            default:
              console.log('Invalid change type: ' + change.type);
          }
          syncResult.promises.push(p.then(
              function () {
                return util.deleteOne(change._id, changesCollection);
              }
          ))
        });
        return syncResult;
      }
  );
}

function synchronizeGoogleToMcc(user, db, syncReq) {
  var calendar = google.calendar('v3');
  var eventsCollection = db.collection('events');

  return new Promise(function (resolve, reject) {
    calendar.events.list(syncReq, function (err, response) {
      if (err !== null) return reject(err);

      console.log(JSON.stringify(syncReq));
      var events = response.items;
      var syncResult = {
        promises: [],
        upserted: 0,
        deleted: 0
      };
      if (events != null && events.length > 0) {
        events.forEach(function (event) {
          var convertedId = util.convertStrToId(event.id);
          if (event.status !== 'cancelled') {
            var convertedEvent = convertEventGoogleToMcc(event);
            convertedEvent.calendar = user.primary;
            syncResult.promises.push(util.upsertOne(convertedId, eventsCollection, convertedEvent));
            syncResult.upserted++;
          } else {
            syncResult.promises.push(util.deleteOneIfExists(convertedId, eventsCollection));
            syncResult.deleted++;
          }
        });
      }

      if (response.nextPageToken) {
        syncReq.pageToken = response.nextPageToken;
        syncResult.promises.concat(synchronizeGoogleToMcc(user, collection, syncReq));
      } else if (response.nextSyncToken) {
        syncResult.promises.push(util.updateOne(user._id, db.collection('users'), {$set: {nextsynctoken: response.nextSyncToken}}));
      }
      resolve(syncResult);
    });
  });
}

/**
 * GET
 */

router.get('/', function (req, res) {
  util.auth(req, function (user) {
    if (user == null) return res.err400("Invalid token");
    var syncReq = getSyncReq(user, req.clientSecrets);
    if (syncReq.hasOwnProperty("authUrl")) return res.json(syncReq);
    var syncResult = {};

    synchronizeMccToGoogle(user, req.db, syncReq).then(
        function(result) {
          syncResult.toGoogle = result;
          return Promise.all(result.promises);
        }
    ).then(
        function() {
          return synchronizeGoogleToMcc(user, req.db, syncReq);
        }
    ).then(
        function(result) {
          syncResult.toMcc = result;
          return Promise.all(result.promises);
        }
    ).then(
        function() {
          delete syncResult.toGoogle.promises;
          delete syncResult.toMcc.promises;
          console.log("SYNC RESULT " + JSON.stringify(syncResult, null, 2));
          return res.json({result: syncResult})
        }
    ).catch(
        function(error) {
          return res.err400(error);
        }
    );
  });
});

/**
 * POST
 */

router.post('/', function (req, res) {
  util.auth(req, function (user) {
    var oauth2Client = getOauth2Client(req.clientSecrets);
    var code = req.body.code;

    oauth2Client.getToken(code, function (err, tokens) {
      if (err) {
        return res.err400('Error while trying to retrieve access token');
      }
      oauth2Client.credentials = tokens;

      util.updateOne(user._id, req.db.collection('users'), {$set: {tokens: tokens, syncinitialized: false}}).then(function () {
        return res.redirect('/api/sync?token=' + user.token);
      }).catch(function() {
        return res.err400('Failed to update sync credentials')
      });
    });
  });
});

module.exports = router;

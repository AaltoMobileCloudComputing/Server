/**
 * Google Calendar sync functionality
 *
 * Functions adapted from https://developers.google.com/google-apps/calendar/quickstart/nodejs
 */

var googleAuth = require('google-auth-library');
var util = require('./util');

/**
 * Get oauth2client based on client_secret.json (represented here as credentials)
 */
function getOauth2Client (credentials) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    return new auth.OAuth2(clientId, clientSecret, redirectUrl);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the given callback function. If tokens are
 * not found redirect to Google authorization url.
 */
exports.authorize = function (req, res, callback) {
    util.auth(req, function(user) {
        var oauth2Client = getOauth2Client(req.clientSecrets);

        if (!user.tokens) {
            var authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: ['https://www.googleapis.com/auth/calendar']
            });
            res.redirect(authUrl); // TODO: Don't actually redirect, just display link and inform user to copy the code
        }
        oauth2Client.credentials = user.tokens;
        callback(oauth2Client);
    });
};

/**
 * Get tokens based on authorization code and store tokens to DB. Finally redirect to /sync
 */
exports.handleOauthCallback = function (req, res) {
    util.auth(req, function(user) {
        var oauth2Client = getOauth2Client(req.clientSecrets);
        var code = req.param.code;

        oauth2Client.getToken(code, function(err, tokens) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = tokens;
            util.updateOne(user._id, req.db.collection('users'), {'tokens': tokens}).then(function() {
                res.redirect('/sync');
            });
        });
    });
};

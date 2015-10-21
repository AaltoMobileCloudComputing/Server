var express = require('express');
var syncUtil = require('../sync-util');
var router = express.Router();

router.get('/', function (req, res) {
    syncUtil.authorize(req, res, function (auth) {
        // TODO: Sync
    });
});

router.get('/auth/:code', function (req, res) {
    syncUtil.handleOauthCallback(req, res);
});
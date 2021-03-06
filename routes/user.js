var express = require('express');
var router = express.Router();
var util = require('../util');
var crypto = require('crypto');


function createUserFromRequest(req) {
  return {
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password
  }
}

/*
 * GET
 */
router.get('/', function (req, res) {
  var collection = req.db.collection('users');
  var username = req.query.username;
  collection.findOne({username: username}, function (err, user) {
    if (user == null)
      res.err400('User not found');
    else {
      if (req.query.password) {
        var passhash =  crypto.pbkdf2Sync(req.query.password, user.salt, 512, 256).toString('hex');
        if (passhash == user.passhash) {
          delete user.salt;
          delete user.passhash;
          res.json(user);
        } else {
          return res.err400("Wrong password");
        }
      } else {
        return res.err400("Password not submited");
      }
    }
  });
});

router.get('/:token', function (req, res) {
  // quite hackish way to make util.auth() work, for real would need refactoring
  req.query.token = req.params.token;
  util.auth(req, function (user) {
    if (user == null) {
      return res.err400("Invalid token");
    }
    else {
      delete user.salt;
      delete user.passhash;
      res.json(user);
    }
  });
});

/*
 * POST
 */
router.post('/', function (req, res) {
  var user = createUserFromRequest(req);

  for (var property in user) {
    if (user[property] == null)
      return res.err400(property + ' must be non-empty');
  }
  user.salt = crypto.randomBytes(30).toString('hex');
  user.passhash = crypto.pbkdf2Sync(user.password, user.salt, 512, 256).toString('hex'); // Hash password with salt
  delete user.password; // Remove password after it is no longer needed
  user.token = util.generateApiToken();
  user.calendars = [];
  var collection = req.db.collection('users');
  collection.findOne({username: user.username}, function (err, result) {
    if (result != null)
      return res.err400('Username already in use');
    else {
      collection.findOne({email: user.email}, function (err, result) {
        if (result != null)
          return res.err400('Email already in use');
        else {
          collection.insertOne(user, function (err, result) {
            delete user.salt; // No need to return salt
            delete user.passhash; // No need to return passhash
            res.json(user); // user will have _id generated by Mongo
          });
        }
      });
    }
  });
});

router.post('/:id', function (req, res) {
  var id = req.params.id;
  util.auth(req, function (user) {
    if (user == null || id != user._id) {
      return res.err400("Invalid token");
    } else {
      for (prop in req.body) {
        if (prop == "salt" || prop == "passhash" || prop == "username" || prop == "_id") {

        }
        else if (prop == "password") {
          user.passhash = crypto.pbkdf2Sync(req.body.password, user.salt, 512, 256).toString('hex');
        }
        else if (prop in user) {
          user[prop] = req.body[prop];
        }
      }
      var collection = req.db.collection('users');
      collection.update({_id: user._id}, user, function (err, result) {
        if (result == null) {
          return res.err400('User not found');
        } else {
          res.json(result);
        }
      });
    }
  });
});

/*
 * DELETE
 */
router.delete('/:id', function (req, res) {
  var id = req.params.id;
  util.auth(req, function (user) {
    if (user == null || id != user._id) {
      return res.err400("Invalid token");
    }
    else {
      var users = req.db.collection('users');
      users.findOneAndDelete({_id: user._id}, function (err, result) {
        if (result == null || result.value == null) {
          return res.err400('Invalid token');
        }
        else {
          res.json(result);
        }
      });
    }
  });
});

module.exports = router;

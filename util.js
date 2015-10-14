exports.err400 = function (error) {
  return this.status(400).json({error: error.message || error});
};

exports.paginate = function (limit, offset) {
  limit = parseInt(limit) || 10;
  offset = parseInt(offset) || 0;
  this.limit(limit);
  this.skip(offset);
  return this;
};

exports.convertTimes = function (startStr, endStr) {
  var start = new Date(startStr);
  var end = new Date(endStr);
  if (!startStr || !endStr || isNaN(start) || isNaN(end)) {
    throw new Error('Invalid start and/or end times');
  } else if (start > end) {
    throw new Error('Start time is after end time');
  } else {
    return {
      start: start,
      end: end,
    }
  }
};

exports.convertID = function (idStr) {
  var ObjectID = require('mongodb').ObjectID;
  if (!ObjectID.isValid(idStr)) {
    return idStr;
  } else {
    return ObjectID(idStr);
  }
};

// TODO: Implement
exports.generateApiToken = function () {
  /* This is very simple solution */
  var crypto = require('crypto');
  return crypto.randomBytes(20).toString('hex');
};


exports.insertOne = function (doc, collection) {
  return collection.insertOne(doc).then(function(doc) {
    return new Promise(function (resolve, reject) {
      resolve(doc);
    });
  });
};

exports.findOne = function (id, collection) {
  return collection.findOne({_id: id}).then(function(doc) {
    return new Promise(function (resolve, reject) {
      if (doc === null) {
        reject(Error('Document with ID ' + id + ' in ' + collection.collectionName + ' not found'));
      }
      resolve(doc);
    });
  });
};

exports.updateOne = function (id, collection, update) {
  return collection.findOneAndUpdate({_id: id}, update, {returnOriginal: false}).then(function(result) {
    return new Promise(function (resolve, reject) {
      if (result.value === null) {
        reject(Error('Document with ID ' + id + ' in ' + collection.collectionName + ' not found'));
      }
      resolve(result);
    });
  });
};

exports.deleteOne = function (id, collection) {
  return collection.findOneAndDelete({_id: id}).then(function(result) {
    return new Promise(function (resolve, reject) {
      if (result.value === null) {
        reject(Error('Document with ID ' + id + ' in ' + collection.collectionName + ' not found'));
      }
      resolve(result);
    });
  });
};

exports.auth = function (req, func) {
  var token = req.query.token;
  var collection = req.db.collection('users');
  return collection.findOne({token: token}, function (err, user) {
    func(user);
  });
};

exports.idInList = function (id, list) {
  for (var idInList in list) {
    if (id == list[idInList]) return true;
  }
  return false;
};

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
      end: end
    }
  }
};

exports.convertTime = function (time) {
  var time = new Date(time);
  if (!time || isNaN(time)) return null;
  return time;
};

exports.convertStrToId = function (idStr) {
  var ObjectID = require('mongodb').ObjectID;
  if (ObjectID.isValid(idStr)) {
    return ObjectID(idStr);
  } else {
    return idStr;
  }
};

exports.convertIdToStr = function (id) {
  if (typeof id === 'string') {
    return id;
  } else {
    return id.toHexString();
  }
};

exports.generateApiToken = function () {
  /* This is very simple solution */
  var crypto = require('crypto');
  return crypto.randomBytes(20).toString('hex');
};


exports.insertOne = function (doc, collection) {
  return collection.insertOne(doc).then(function(doc) {
    return new Promise(function (resolve, reject) {
      if (doc.result.ok !== 1) {
        reject(Error('Failed to insert document'));
      }
      resolve(doc);
    });
  });
};

exports.findOne = function (id, collection) {
  return exports.findOneWithQuery({_id: id}, collection);
};

exports.findOneWithQuery = function (query, collection) {
  return collection.findOne(query).then(function(doc) {
    return new Promise(function (resolve, reject) {
      if (doc === null) {
        reject(Error('Document with ID ' + id + ' in ' + collection.collectionName + ' not found'));
      }
      resolve(doc);
    });
  });
};

exports.updateOne = function (id, collection, update) {
  return exports.updateOneWithQuery({_id: id}, collection, update);
};

exports.updateOneWithQuery = function (query, collection, update) {
  return collection.findOneAndUpdate(query, update, {returnOriginal: false}).then(function(result) {
    return new Promise(function (resolve, reject) {
      if (result.value === null) {
        reject(Error('Document with ID ' + id + ' in ' + collection.collectionName + ' not found'));
      }
      resolve(result);
    });
  });
};

exports.upsertOne = function (id, collection, update) {
  return collection.findOneAndUpdate({_id: id}, update, {returnOriginal: false, upsert: true}).then(function(result) {
    return new Promise(function (resolve, reject) {
      if (result.value === null) {
        reject(Error('Upserting document with ID ' + id + ' in ' + collection.collectionName + ' failed'));
      }
      resolve(result);
    });
  });
};

exports.deleteOne = function (id, collection) {
  return exports.deleteOneWithQuery({_id: id}, collection);
};

exports.deleteOneWithQuery = function (query, collection) {
  return collection.findOneAndDelete(query).then(function(result) {
    return new Promise(function (resolve, reject) {
      if (result.value === null) {
        reject(Error('No document to delete'));
      }
      resolve(result);
    });
  });
};

exports.deleteOneIfExists = function (id, collection) {
  return collection.findOneAndDelete({_id: id}).then(function(result) {
    return new Promise(function (resolve, reject) {
      if (result.ok !== 1) {
        reject(Error('Failed to delete document'));
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

exports.err400 = function (error) {
  this.status(400).json({error: error});
};

exports.paginate = function (limit, offset) {
  limit = parseInt(limit) || 10;
  offset = parseInt(offset) || 0;
  this.limit(limit);
  this.skip(offset);
  return this;
};

exports.convertTimes = function (startStr, endStr) {
  console.log(startStr);
  console.log(endStr);
  if (!startStr && !endStr) {
    return {error: 'Invalid start and end times'}
  } else if (!startStr) {
    return {error: 'Invalid start time'}
  } else if (!endStr) {
    return {error: 'Invalid end time'}
  }

  var start = new Date(startStr);
  var end = new Date(endStr);
  if (start > end) {
    return {error: 'Start time is after end time'}
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
    return null;
  } else {
    return ObjectID(idStr);
  }
};

// TODO: Implement
exports.generateApiToken = function () {
  return 'api_token';
};

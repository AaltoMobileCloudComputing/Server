exports.err400 = function (reason) {
  this.status(400).json({reason: reason});
};

exports.paginate = function (limit, offset) {
  limit = parseInt(limit) || 10;
  offset = parseInt(offset) || 0;
  this.limit(limit);
  this.skip(offset);
  return this;
};

exports.validateTimes = function (startStr, endStr) {
  var start;
  var end;
  try { start = new Date(startStr); } catch (e) { }
  try { end = new Date(endStr); } catch (e) { }

  if (start === null && end === null) {
    return {reason: 'Invalid start and end times'}
  } else if (start === null) {
    return {reason: 'Invalid start time'}
  } else if (end === null) {
    return {reason: 'Invalid end time'}
  } else if (start > end) {
    return {reason: 'Start time is after end time'}
  } else {
    return {
      start: start,
      end: end,
    }
  }
}

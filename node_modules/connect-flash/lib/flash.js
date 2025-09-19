const format = require('util').format;

module.exports = function flash(options = {}) {
  const safe = options.unsafe === undefined ? true : !options.unsafe;

  return function(req, res, next) {
    if (req.flash && safe) return next();
    req.flash = _flash;
    next();
  };
};

function _flash(type, msg) {
  if (!this.session) throw new Error('req.flash() requires sessions');
  const msgs = (this.session.flash = this.session.flash || {});

  if (type && msg) {
    if (arguments.length > 2 && format) {
      const args = Array.prototype.slice.call(arguments, 1);
      msg = format.apply(undefined, args);
    } else if (Array.isArray(msg)) {
      msg.forEach((val) => {
        (msgs[type] = msgs[type] || []).push(val);
      });
      return msgs[type].length;
    }
    return (msgs[type] = msgs[type] || []).push(msg);
  } else if (type) {
    const arr = msgs[type];
    delete msgs[type];
    return arr || [];
  } else {
    this.session.flash = {};
    return msgs;
  }
}

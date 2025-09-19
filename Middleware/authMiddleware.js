module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  req.flash('error_msg', 'Please log in first');
  return res.redirect('/login');
};

module.exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error_msg', 'Admin access only');
  return res.redirect('/login');
};

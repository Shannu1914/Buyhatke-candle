// Middleware to check if user is logged in
module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  req.flash('error_msg', 'Please log in first');
  return res.redirect('/login');
};

// Middleware to check if admin
module.exports.isAdmin = (req, res, next) => {
  console.log('isAdmin check:', req.session.user);
  if (req.session.user && req.session.user.isAdmin) return next();
  req.flash('error_msg', 'Admin access only');
  return res.redirect('/login');
};

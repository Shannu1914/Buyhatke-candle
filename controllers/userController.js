const User = require('../models/User');

exports.dashboard = async (req, res) => {
  try {
    res.render('user-dashboard', {
      user: req.session.user,
      active: 'user',
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

exports.profile = async (req, res) => {
  try {
    console.log('Session user:', req.session.user); // <-- add this

    if (!req.session.user) {
      req.flash('error_msg', 'No user in session');
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.user._id).lean();
    console.log('DB user:', user); 
    if (!user) {
      req.flash('error_msg', 'User not found in DB');
      return res.redirect('/login');
    }

    res.render('profile', {
      user,
      active: 'user',
    });
  } catch (err) {
    console.error(err);
    res.redirect('/user/dashboard');
  }
};


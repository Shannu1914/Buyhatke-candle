const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
  res.render('login');
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash('error_msg', 'Invalid email or password');
    return res.redirect('/login');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash('error_msg', 'Invalid email or password');
    return res.redirect('/login');
  }

  req.session.user = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin
  };


  req.flash('success_msg', 'Welcome back!');
  res.redirect('/');
};

exports.getRegister = (req, res) => {
  res.render('register');
};

exports.postRegister = async (req, res) => {
  const { name, email, password, password2 } = req.body;

  if (!name || !email || !password || !password2) {
    req.flash('error_msg', 'Please fill in all fields');
    return res.redirect('/register');
  }

  if (password !== password2) {
    req.flash('error_msg', 'Passwords do not match');
    return res.redirect('/register');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    req.flash('error_msg', 'Email already registered');
    return res.redirect('/register');
  }

  const newUser = new User({ name, email, password });
  await newUser.save();

  req.flash('success_msg', 'Registration successful! Please log in.');
  res.redirect('/login');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

const User = require('../models/User');
const path = require('path');
const fs = require('fs');

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

exports.uploadProfileImage = async (req, res) => {
  if (!req.files || !req.files.profileImage) {
    return res.redirect('/user/profile');
  }

  const image = req.files.profileImage;
  const uploadPath = path.join(__dirname, '..', 'public/uploads/profiles', image.name);

  // Delete old image if exists in session user
  if (req.session.user.profileImage && req.session.user.profileImage !== '/uploads/profiles/default-profile.png') {
    fs.unlink(path.join(__dirname, '..', 'public', req.session.user.profileImage), err => {});
  }

  // Save new image
  await image.mv(uploadPath);

  // Update user in DB
  const user = await User.findById(req.session.user._id);
  user.profileImage = '/uploads/profiles/' + image.name;
  await user.save();

  // Update session user
  req.session.user.profileImage = user.profileImage;

  res.redirect('/user/profile');
};

// DELETE PROFILE IMAGE
exports.deleteProfileImage = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login');

    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect('/login');

    // Delete old image file if exists
    if (user.profileImage && user.profileImage !== '/uploads/profiles/default-profile.png') {
      const filePath = path.join(__dirname, '..', 'public', user.profileImage);
      fs.unlink(filePath, err => { if(err) console.error(err); });
    }

    // Set default image
    user.profileImage = '/uploads/profiles/default-profile.png';
    await user.save();

    // Update session
    req.session.user.profileImage = user.profileImage;

    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/user/profile');
  }
};

// DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login');

    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect('/login');

    // Delete profile image file if exists
    if (user.profileImage && user.profileImage !== '/uploads/profiles/default-profile.png') {
      const filePath = path.join(__dirname, '..', 'public', user.profileImage);
      fs.unlink(filePath, err => { if(err) console.error(err); });
    }

    // Delete user from DB
    await User.deleteOne({ _id: user._id });

    // Destroy session
    req.session.destroy(err => {
      if (err) console.error(err);
      res.redirect('/');
    });
  } catch (err) {
    console.error(err);
    res.redirect('/user/profile');
  }
};
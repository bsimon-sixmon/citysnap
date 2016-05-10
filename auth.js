var express = require('express');
var passport = require('passport');
var router = express.Router();

/* Facebook login */
router.get('/facebook',	passport.authenticate('facebook', { scope : "email, user_hometown" }));

/* Linkedin callback */
router.get('/facebook/callback', passport.authenticate('facebook', {
	successRedirect: '/editprofile',
	failureRedirect: '/login'
}));


// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
router.get('/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email'] }));

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
router.get('/google/callback', passport.authenticate('google',
	{ successRedirect: '/editprofile',
	failureRedirect: '/login' }));


// Redirect the user to Twitter for authentication.  When complete, Twitter
// will redirect the user back to the application at
//   /auth/twitter/callback
router.get('/twitter', passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
router.get('/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/editprofile',
                                     failureRedirect: '/login' }));

module.exports = router;
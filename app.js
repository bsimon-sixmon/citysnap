var config = require("./config/config").config()
	, express = require('express')
	, session = require('express-session')
	, redisStore = require('connect-redis')(session)
	, passport = require('passport')
	, cookieParser = require('cookie-parser')
	, bodyParser = require('body-parser')
	, logger = require('morgan')
	, path = require('path')
	, multer  = require('multer')
	, router = express.Router()
	, fs = require("fs")
	, pg = require('pg')
	, cloudinary = require('cloudinary')
	, LocalStrategy = require('passport-local').Strategy
	, FacebookStrategy = require('passport-facebook').Strategy;


var app = express();


// MiddleWare
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    store: new redisStore({
    	host : config.redis_host,
    	port : config.redis_port
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

var uploading = multer({
  dest: __dirname + '../public/uploads/',
});

// DB
var db = require('./models_sql');

// CLOUDINARY
cloudinary.config({ 
  cloud_name: 'sixmon', 
  api_key: '722328586973638', 
  api_secret: 'xYd5cx_BDjnUZ3DVw8LoprTV81o' 
});

// AUTH
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new FacebookStrategy({
		clientID: '106465799719695',
		clientSecret: '4042a822a2cc69ebaecc9ecb0f56d11e',
		callbackURL: "/auth/facebook/callback",
		profileFields: ['id', 'displayName','first_name','last_name', 'photos', 'email'],
		enableProof: true
	},
	function(accessToken, refreshToken, profile, done) {

		//console.log(accessToken);
		//console.log(refreshToken);
		console.log(profile);
		//console.log(db);
		//done(null, profile);

		db.user.findOne({
			where: { Email : profile.emails[0].value, FacebookUid: profile.id }
		}).then(function(user) {

			if(user){
				console.log("User exists");
				return done(null, user);
			}
			else{
				
				console.log("User does not exist");
				
				var user = db.user.build({ 
					FacebookUid: profile.id,
					Email: profile.emails[0].value, 
					FirstName: profile.name.givenName,
					LastName: profile.name.familyName
				});

				user.save().then(function(u) {
					console.log(u);
					return done(null, u);
				}).error(function(error) {
					// Ooops, do some error-handling
					console.log(error);
					console.log(u);
					return done(null, u);
				});

			}
		});


		/*db.user.findOrCreate({
				where: { Email : profile.emails[0].value, FacebookUid: profile.id },
				defaults: { 
					Password : '',
					Lastname : profile.name.familyName,
					Firstname : profile.name.givenName
				}
			})
			.spread(function(user, created) {		
				console.log("FB auth");		
				return done(null, user);
			});	*/
		
	}
));


// LOCAL STRATEGY
passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},
	function(email, password, done) {

		db.user.findOne({
			where: { Email: email}
		}).then(function(user) {
			console.log("AUTH LOCAL");
			console.log(user);
			if (!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			if (!user.validPassword(password)) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		});
	}
));

// ROUTES FACEBOOK

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'public_profile, email' }));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));


// ROUTES SIGNIN/SIGNUP

// GET /login
app.get('/login', function(req, res){
	res.render('login', { title: 'Se connecter' });
});

// POST /login
app.post('/login',
	passport.authenticate('local', { successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: false })
);


// GET /signup
app.get('/signup', function(req, res){
	res.render('signup', { title: "S'inscrire" });
});

// POST /signup
app.post('/signup', function(req, res){

	  	console.log("trying to create new user : " + req.body.email);
	  	
		var user = db.user.build({ 
		  Email: req.body.email, 
		  FirstName: req.body.firstname,
		  LastName: req.body.lastname
		});

		user.makePassword(req.body.password);

		console.log();

		user.save()
		.then(function(u) {

			return res.redirect("/login");
			
		}).error(function(error) {
		  // Ooops, do some error-handling
		  console.log(error);
		  return res.redirect("/error");
		});

	});


// GET /logout
app.get('/logout', function(req, res){
	req.logout();
  	res.redirect('/');
});

// HOME
app.get('/', function (req, res) {

	// Authenticated access	
	if(req.user){
		return res.render('index', { title: 'Wiki map photo from LH', user : req.user });		
	}
	else {		
		return res.render('index', { title: 'Wiki map photo from LH' });		
	}
	
});

app.get('/search', function (req, res) {

	var south = req.param('s');
	var north = req.param('n');
	var east = req.param('e');
	var west = req.param('w');
	var sdate = req.param('sdate');
	var edate = req.param('edate');

	QueryPhoto(south,north,west,east,sdate,edate,function(results){
		return res.send(results);	
	});
	
	
});


//----------------------------------------------------------------
// PHOTO

// Url pour le formulare d'upload
app.get('/upload', function (req, res) {

	// Authenticated access	
	if(req.user){
		res.render('upload', { title: 'Upload page', user : req.user });
	}
	else {		
		return res.redirect("/login");
	}

	
});

// POST de la photo
app.post('/photo/upload',  function(req, res) {

	if(!req.user){
		return res.error("Auth error.");
	}

	var multiparty = require('multiparty');
	var gm = require('gm');
	var fs = require('fs');
	var form = new multiparty.Form();
	var size = '';
	var fileName = '';

	console.log(req.params.start_year);
	
	form.on('part', function(part){
		//console.log(part);
		if(!part.filename) 
			return;
		size = part.byteCount;
		fileName = part.filename;
	});

	form.on('file', function(name, file){

		//console.log(file);
		//console.log(file.path);
		//console.log(__dirname);
		var tmp_path = file.path
		var target_path = __dirname + '/public/uploads/' + file.originalFilename;
		fs.renameSync(tmp_path, target_path, function(err) {
			if(err) console.error(err.stack);
		});

		// TODO : remove duplicates with phash !
		// TODO : remove file in public folder !

		console.log("cloudinary upload...");
		// Upload on cloudinary
		cloudinary.uploader.upload(target_path, function(result) { 
			console.log("cloudinary upload... done.");
			console.log(result);
			return res.send(result);
		}, { phash : true });
		
		/*gm(tmp_path)
		.resize(150, 150)
		.noProfile()
		.write(thumbPath + 'small.png', function(err) {
		    if(err) console.error(err.stack);       
		});*/
	});

	form.parse(req);
	
});


// POST de la photo
app.post('/photo',  function(req, res) {

	if(!req.user){
		return res.error("Auth error.");
	}

	console.log(req.user);
	var cloudinaryData = JSON.parse(req.body.upload_result);

	var photo = db.photo.build({ 
		Url: "/uploads/" + req.body.filename,
		Author : req.body.author,
		Description : req.body.description,
		Credits : req.body.credits,
		Name : req.body.name,
		PublicId : cloudinaryData.public_id,
		Hash : cloudinaryData.phash,
		Width : cloudinaryData.width,
		Height : cloudinaryData.height,
		Url : cloudinaryData.url,
		StartYear : req.body.start_year,
		EndYear : req.body.end_year,
		Latitude : req.body.latitude,
		Longitude : req.body.longitude,
		UserId : req.user.Id
	});


	photo.save()
	.then(function(u) {

		return res.redirect("/");

	}).error(function(error) {
		// Ooops, do some error-handling
		console.log(error);
		return res.redirect("/error");
	});


});


//-----------------------------------------------------------------
// LIKES
app.get('/photo/:id/like', function(req, res){

	if(req.user != null){

		var photoId = req.params.id;
		console.log(photoId);
		console.log(req.user.first_name);


		db.like.findAll({
			where: {
				UserId: req.user.id,
				PhotoId: photoId
			},
			limit : 1
		}).then(function(result){
			console.log(result);

			if(result.length == 0){
				var like = db.like.build({ 
					PhotoId: photoId,
					UserId : req.user.id,
					Horodate : new Date()
				});

				
				like.save()
				.then(function(l) {
					return res.redirect("/");			
				}).error(function(error) {
					// Ooops, do some error-handling
					console.log(error);
					return res.redirect("/error");
				});	

				return res.send("OK");			
			}
			else{
				return res.send("ERROR");
			}

		});
	}
	else{
		return res.send("ERROR");
	}

});

//-----------------------------------------------------------------
// COMMENTS
app.post('/photo/:id/comment', function(req, res){

	console.log(req.body);

	if(req.user != null){
		var photoId = req.params.id;
		console.log(photoId);
		console.log(req.user.first_name);
		var comment = db.comment.build({
			PhotoId: photoId,
			UserId : req.user.id,
			Comment: req.body.comment,
			Horodate : new Date()
		});

		comment.save()
		.then(function(l) {
			return res.send("OK");

		}).error(function(error) {
			// Ooops, do some error-handling
			console.log(error);
				return res.redirect("/error");
			});
	}
	else{
		return res.send("ERROR COMMENT");

	}
});

app.get('/photo/:id/comments', function(req, res){

	var photoId = req.params.id;

	/*db.comment.findAll({
			where: {
				PhotoId: photoId
			},
			order: 'horodate DESC'
		}).then(function(result){	
			if(result){		
				return res.send(result);			
			}
			else{
				return res.send("ERROR");
			}
		});*/
	
	QueryComments(photoId, function(result){
		if(result){		
			return res.send(result);			
		}
		else{
			return res.send("ERROR");
		}
	});
});
 


//-----------------------------------------------------------------
// LOGIN
app.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/users/' + req.user.username);
  });

var server = app.listen(config.app_port, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});



var pg = require('pg');

var conString = config.sql_connection;



var QueryPhoto = function(south, north, west, east, startdate, enddate, callback){
	var client = new pg.Client(conString);
	client.connect(function(err) {
		if(err) {
			return console.error('could not connect to postgres', err);
		}

		var query = "SELECT CASE WHEN p.url like 'http%' THEN p.url ELSE 'http://lhistomap.com:3000' || p.url END as url,p.id,p.name,p.start_year,p.end_year,p.latitude,p.longitude,p.public_id,u.first_name,u.last_name,count(l.id) as nblikes from photos p ";
		query += " INNER JOIN users u on p.user_id=u.id";
		query += " LEFT OUTER JOIN likes l on l.photo_id=p.id";
		query += " WHERE ((start_year BETWEEN " + startdate + " AND " + enddate + ")";
		query += " OR (end_year BETWEEN " + startdate + " AND " + enddate + "))";
		query += " AND (latitude BETWEEN " + south + " AND " + north + ")";
		query += " AND (longitude BETWEEN " + west + " AND " + east + ")";
		query += " GROUP BY p.url,p.id,p.name,p.start_year,p.end_year,p.latitude,p.longitude,p.public_id,u.first_name,u.last_name,u.id";

		console.log(query);

		client.query(query, function(err, result) {
			if(err) {
				return console.error('error running query', err);
		}
		console.log(result.rows[0]);
		//output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
		client.end();

		callback(result.rows);
		});
	});
}

var QueryComments = function(photoId, callback){
	var client = new pg.Client(conString);
	client.connect(function(err) {
		if(err) {
			return console.error('could not connect to postgres', err);
		}

		var query = "SELECT c.comment,to_char(c.horodate, 'dd/MM/YYYY') as horodate,u.first_name,u.last_name from comments c inner join users u on c.user_id=u.id where c.photo_id=" + photoId;

		console.log(query);

		client.query(query, function(err, result) {
			if(err) {
				return console.error('error running query', err);
		}
		console.log(result.rows[0]);
		//output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
		client.end();

		callback(result.rows);
		});
	});
}
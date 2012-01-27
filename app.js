
/**
 * Module dependencies.
 */




var io = require('socket.io')
	, express = require('express')
	, MemoryStore = express.session.MemoryStore
  , routes = require('./routes')
	, upnp = require('./upnp')
	, sessionStore = new MemoryStore()
	, http = require('http');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
	app.use(express.cookieParser()); 
	app.use(express.session({store: sessionStore, secret: 'bahbahblacksheep', key: 'express.sid'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});



getIndex = function(req, res){
			upnp.trackData(function(data){
				if(data.devices.length > 0){
					console.log("Session should have a value of "+data.devices[0].uuid);
					req.session.renderer = data.devices[0].uuid;
				}
				res.render('tracks', data);
		 });
};



// Routes

app.get('/', getIndex);
app.get('/getTracks', function(req,res){
	upnp.trackData(function(data){
		res.send(JSON.stringify(data.tracks));
	});
});
//app.get('/setmr/:id', routes.setmr);


app.listen(80);
var findNumbers = function(){
		finalCallback = function(){};
		options = {
		  host: 'api.discogs.com',
		  port: 80,
		  path: '',
		  headers: {
		      "Accept-Encoding": "gzip"
		  }
		};
	function makeRequest(callback){
		http.get(options, function(getRes){
		  var body = "";

		  getRes.on('data', function(chunk){
		      body = body + chunk;
		  });

		  getRes.on('end', function(err, data){
				if(!err){
					callback(body)
				}
			});
		});
	}
	function getTracks(artist, album, releaseid){
		options.path = "/releases/"+releaseid;
		makeRequest(function(data){
			console.log("in getTracks");
			console.log(data);
			var tracks = JSON.parse(data);
			var result=[];
			if(tracks && tracks.tracklist && tracks.tracklist.length){						
				tracks.tracklist.forEach(function(item){
					result.push({Artist:artist,Album:album,Title:item.title,TrackNumber:item.position});
				});
			}
			finalCallback(result);
		});
	}
	function getRelease(artist,album){
		options.path = "/database/search?artist="+encodeURIComponent(artist)+"&release_title="+encodeURIComponent(album);
		makeRequest(function(data){
			console.log("in getRelease");
			console.log(data);
			var artistData = JSON.parse(data);
			for(i = 0; i < artistData.results.length; i++){
				if(artistData.results[i].format && artistData.results[i].format.length && artistData.results[i].format[0] === "CD"){
					getTracks(artist,album,artistData.results[i].id);
					break;
				}		
			};
		});
	}
	return{
		doSearch: function(artist,album,callback){
			finalCallback = callback;
			getRelease(artist,album);
		}
	}
}

findNumbers().doSearch("Future Islands","On The Water",function(data){console.log(data)});




var sio = io.listen(app);
var parseCookie = require('connect').utils.parseCookie;
var Session = require('connect').middleware.session.Session;
sio.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['express.sid'];
        // save the session store to the data object 
        // (as required by the Session constructor)
        data.sessionStore = sessionStore;
        sessionStore.get(data.sessionID, function (err, session) {
            if (err || !session) {
                accept('Error', false);
            } else {
                // create a session object, passing data as request and our
                // just acquired session data
                data.session = new Session(data, session);
                accept(null, true);
            }
        });
    } else {
       return accept('No cookie transmitted.', false);
    }
});

webRenderers = sio
	.of('/renderer')
	.on('connection', function (socket) {
    var hs = socket.handshake;
    console.log('A socket with sessionID ' + hs.sessionID 
        + ' connected!');
    // setup an inteval that will keep our session fresh
    var intervalID = setInterval(function () {
        // reload the session (just in case something changed,
        // we don't want to override anything, but the age)
        // reloading will also ensure we keep an up2date copy
        // of the session with our connection.
        hs.session.reload( function () { 
            // "touch" it (resetting maxAge and lastAccess)
            // and save it back again.
            hs.session.touch().save();
						console.log("after reload renderer = "+hs.session.renderer);
        });
    }, 60 * 1000);
		socket.on('rendererAdded',function(){
			console.log("WEB RENDERER ADDED hs.sessionid = " +hs.sessionID);
			upnp.addWebRenderer(hs.sessionID,socket)
		});
		
});
upnp.init(sio);


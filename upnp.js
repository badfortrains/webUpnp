var http = require('http');
var BUFF_SIZE = 40;//must be even
var COLUMNS = {Artist:1,Album:1,Title:1,TrackNumber:1,_id:1};
var SEARCHABLE = ["Artist","Album","Title"];
var SORTBY = {
	Artist : {Artist: 1, Album: 1, TrackNumber: 1},
	Album : {Album: 1, TrackNumber: 1},
	Title : {Title: 1},
	TrackNumber : {TrackNumber: 1},
	ArtistDes : {Artist: -1, Album: -1, TrackNumber: -1},
	AlbumDes : {Album: -1, TrackNumber: -1},
	TitleDes : {Title: -1},
	TrackNumberDes : {TrackNumber: -1},
}

var mediaWatcher = require('./media_watcher');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var server = new mongodb.Server("127.0.0.1", 27017, {});
var db = new mongodb.Db('test', server);
db.open(function (error, client) {
  if (error) throw error;
  db.dropDatabase(function(err, result) {
  	collection = new mongodb.Collection(client, 'tracks');
  });
});


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


var UpnpRenderer = function(uuid,name){
	this.uuid = uuid;
	this.name = name;
	this.listBuffer = [];
	this.nextTrack = 0;
}
UpnpRenderer.prototype = {
	active: "null",//sid of active controller
	currentTrack: false,
	searchObject: {},
  sortObject: SORTBY.Artist,
	bufferRefill: function(){},
	stateChangeCB: function(){},
	playResultCB: function(){},
	trackChangeCB: function(){},
	stateChangeCB: function(){},
	trackListChangeCB: function(){},
	setActive: function(sid){
		this.active = sid;
	},
	_makeCurrent: function(){
		if(currentRenderer != this.uuid){
	 		if(mw.setRenderer(this.uuid)){
				currentRenderer = this.uuid;
			}else{
				return {res: false,error: "Failed to select renderer"}
			}
		}
		return true;
	},
  setSearch: function(criteria){
		var newSearch = [];
		SEARCHABLE.forEach(function(entry){
			var temp = {};
			temp[entry] = new RegExp(criteria,"i");
			newSearch.push(temp);
		});
		this.searchObject = {$or:newSearch};
		this.getTrackList();
	},
	setSort: function(by){
		console.log("BY = " + by);
		console.log(SORTBY[by]);
		this.sortObject = SORTBY[by];
		this.getTrackList();
	},
	getTrackList: function(){
		var that = this;
		console.log(that.sortObject);
		db.collection("tracks",function(error,tracks){
			console.log("searchObject OBJECT");
			console.log(that.searchObject);
			tracks.find(that.searchObject,COLUMNS).sort(that.sortObject).toArray(function(err, tracks){
				that.trackListChangeCB({tracks: tracks,currentTrack: that.currentTrack});
				if(that.currentTrack){
					that.getNextTracks(that.currentTrack._id,tracks);
				}
			});
		});
	},
  getNextTracks: function(id,tracks){
		id += "";
		console.log("typeof = "+typeof(id));
		console.log("in get Next Tracks id ="+id);
		console.log("track length = "+tracks.length);
		if(!id){
			this.listBuffer = [];
			return;
		}
		function findId(collection,uid){
			var length;
			length = collection.length;
			for(var i=0;i<length;i++){
				if(collection[i]._id == uid)
					return i;
			}
			return false;
		}
		var index = findId(tracks,id);
		console.log("Index  = "+index);
		if(index === false){
			this.listBuffer = [];
			return;
		}
		var halfBuff = Math.round((BUFF_SIZE/2));
		var end = halfBuff + index + 1;
		var start;
		if(index < halfBuff){
			start = 0;
			this.nextTrack = index + 1;
		}else{
			start = index - halfBuff;
			this.nextTrack = halfBuff + 1;
		}
		var newTracks = [];
		if(end > tracks.length){
			end = tracks.length;
		}
		console.log("start =" + start);
		console.log("end = "+end);
		for(var i=start; i<end; i++){
			newTracks.push(tracks[i]._id);
		}
		this.listBuffer = newTracks;
	},
  getPlaylist: function(id){

		db.collection("tracks",function(error,tracks){
			tracks.find(this.searchObject,COLUMNS).sort(this.sortObject).toArray(function(err, tracks){
				this.getNextTracks(id,tracks);
			}.bind(this));
		}.bind(this));
  },
	play: function(trackId,callback){
			if(callback){
				this.playResultCB = callback;
			}else{
				callback = this.playResultCB;
			}
			var playSuccess = function(track){
				this.currentTrack = track;
				this.trackChangeCB(track);
			}.bind(this);
					
			var selected = this._makeCurrent();
			if(selected !== true)
				return callback({res: false,error: "Failed to select renderer"});
			db.collection("tracks",function(error,tracks){
				//var o_id = new BSON.ObjectID(trackId);
				tracks.find({_id: trackId}).toArray(function(err, item){
					if(err){
						console.log(err);
						return callback({res: false,error: "Could not find track"});
					}
					mw.stop(function(resS){
						mw.open(function(resO){
							mw.play(function(resP){
								if(resP.res){	
									playSuccess(item[0]);
								}
								return callback({res: resP});
							});
						},item[0]);
					});
				});
			});
	},
	getStates: function(){
			var event = {uuid: this.uuid, name:"TransportState",value: this.TransportState};
			this.stateChangeCB(event);
			event.name = "Mute";
			event.value = this.Mute;
			this.stateChangeCB(event);
			event.name = "Volume";
			event.value = this.Volume;
			this.stateChangeCB(event);
			if(this.currentTrack){
				this.trackChangeCB(this.currentTrack);
			}
	},
	playNext: function(back){
		if(back){
			nextIndex = this.nextTrack - 2;
			this.nextTrack--;
		}else{
			nextIndex = this.nextTrack;
			this.nextTrack++;
		}
		console.log("buf length = "+this.listBuffer.length);
		console.log("nextIndex = "+nextIndex);
		console.log(this.listBuffer[nextIndex]);
		if(this.listBuffer.length > nextIndex && nextIndex >= 0){
		  this.play(this.listBuffer[nextIndex]);
			if(nextIndex === BUFF_SIZE-1 || nextIndex === 0){
				this.getPlaylist(this.listBuffer[nextIndex]);
			}
		}
	},
	stateChanged: function(event){
		if( (event.value === "TRANSITIONING" && this.listBuffer === []) || event.value === "STOPPED"){
			this.currentTrack = {Title:"Unknown Local Track", Artist:"", Album:""};
			this.listBuffer = [];
		}
		if(this[event.name] !== event.value){
 				if(event.value === "PLAYING" || event.value === "STOPPED" || event.value === "PAUSED_PLAYBACK" || event.name === "Mute" || event.name === "Volume"){
					this[event.name] = event.value;
					stateChangeCB(event);
				}
		}

	},
	getRenderer: function(){
		return({uuid: this.uuid, name: this.name});
	},
	playPause: function(){
		if(this.TransitionState === "PLAYING"){
			mw.pause(function(){});
		}else if(this.TransitionState === "PAUSED_PLAYBACK"){
			mw.play(function(){});
		}
	}
}

var WebRenderer = function(socket,uuid,name){
	this.socket = socket;
	this.uuid = uuid;
	this.name = name;
	this.listBuffer = [];
	this.nextTrack = 0;
	this.Mute = 0;
	this.Volume = 50;

	this.socket.on("stateChanged",function(event){
		if(event.value === "NO_MEDIA_PRESENT"){
			console.log("HERE");
			this.playNext();
		}else{
			if(event.name === "playResult"){
				this.trackChangeCB(this.currentTrack);
				this.playResultCB(event.value);
			}else{
				this[event.name] = event.value;
			}
			event.uuid = this.uuid;
			this.stateChangeCB(event);
		}
	}.bind(this));
}
WebRenderer.prototype = new UpnpRenderer();
WebRenderer.prototype.play = function(trackId, callback){
	if(callback){
		this.playResultCB = callback;
	}else{
		callback = this.playResultCB;
	}
	var that = this;
	db.collection("tracks",function(error,tracks){
		console.log(error);
		if(typeof(trackId)=='string'){
			trackId = new BSON.ObjectID(trackId);
		}
		tracks.find({_id: trackId}).toArray(function(err, item){
			if(err || item.length === 0){
				console.log(trackId);
				console.log(err);
				return callback({res: false,error: "Could not find track"});
			}	
			var resources = item[0].Resources;
			var length = resources.length;
			var i;
			var Uri;
			for(i=0; i<length; i++){
				if(resources[i].ProtocolInfo.indexOf("http-get:*:audio/mpeg:DLNA.ORG_PN=MP3;") !== -1){
					Uri = resources[i].Uri;
					that.socket.emit("play",Uri);
					that.currentTrack = item[0];
					break;
				}
			}
			if(i==length){
				return callback({res: false,error: "No mp3 file found"});
			}
		});
	});
};
WebRenderer.prototype.playPause = function(){
	this.socket.emit("playPause");
}

var Controller = function(sid,socket,target){
	this.socket = socket;
	if(target){
		this.renderer = target;
	}
	this.sid = sid;
}

Controller.prototype = {
	renderer: false,
	sortObject: SORTBY.Artist,
	searchObject: {},
	getTrackList: UpnpRenderer.prototype.getTrackList,
	trackListChangeCB: function(data){
		this.socket.emit('newTracks',data);
	},
	setSearch: function(criteria){
		if(this.renderer !== false && rendererList[this.renderer].active === this.sid){
			rendererList[this.renderer].setSearch(criteria);
		}else{
			var justSearch = UpnpRenderer.prototype.setSearch.bind(this);
			justSearch(criteria);
		}
	},
	setSort: function(category){
		if(this.renderer !== false && rendererList[this.renderer].active === this.sid){
			rendererList[this.renderer].setSort(category);
		}else{
			var justSort = UpnpRenderer.prototype.setSort.bind(this);
			justSort(category);
		}
	},
	play: function(trackId){
		if(this.renderer === false){
			this.socket.emit("error",{action: "playTrack", message: "cannot play track, no renderer selected"});
		}else{
			rendererList[this.renderer].setActive(this.sid);
			rendererList[this.renderer].play(trackId,function(res){
				if(!res.res){
					this.socket.emit("error",{action: "playTrack", message: res.error});
				}
			}.bind(this));
			rendererList[this.renderer].getPlaylist(trackId);
		}
	},
	setRenderer: function(target){
		if(rendererList[target]){
			this.renderer = target;
		}else{
			this.socket.emit("error",{action: "setRenderer", message: "requested renderer no longer available"});
		}
	},
	getStates: function(){
		if(this.renderer !== false){
			rendererList[this.renderer].getStates();
		}
	}
}

//our binding to the platinum library 
var mw = new mediaWatcher.MediaWatcher();
var rendererList = [];
var controllerList = [];
var mrAddedCB = function(){};
var currentRenderer;


var onTracksAdded = function(data){
	//add to db;
	if(data !== 'fail'){
		db.collection("tracks",function(error,tracks){
			tracks.insert(data);
			tracks.ensureIndex({Artist: 1,Album: 1, Title: 1});
			console.log("tracks inserted");
		});
	}

}

var respond = function (data){
	event = mw.pollEvent();
	while(event){
		if(event.name === "msAdd") {
			var server = mw.getServer();
			mw.getTracks(onTracksAdded,server);
			console.log("serverAdded");
	  }else if(event.name === "mrAdd"){
			rendererList[event.uuid] = new UpnpRenderer(event.uuid,event.value);
			mrAddedCB({uuid: event.uuid, name: event.value});
			console.log("got renderer");
		}else if(rendererList[event.uuid]){
			curMR = rendererList[event.uuid];
			if(event.value === "NO_MEDIA_PRESENT"){
				curMR.playNext();
			}else{ 
				curMR.stateChanged(event);
			}
		}
		event = mw.pollEvent();
	}
	mw.watchEvents(respond);
};



var events = {
	onStateChange : function(callback){
			UpnpRenderer.prototype.stateChangeCB = callback;
			WebRenderer.prototype.stateChangeCB = callback;
	},
	onTrackListChange: function(callback){
			UpnpRenderer.prototype.trackListChangeCB = callback;
			WebRenderer.prototype.trackListChangeCB = callback;
	},
	onTrackChange: function(callback){
			UpnpRenderer.prototype.trackChangeCB = callback;
			WebRenderer.prototype.trackChangeCB = callback;
	},
  onMRAdded: function(callback){
		mrAddedCB = callback;
	}
}


var controlPoint;
exports.init = function(sio){
	mw.startUpnp(function(){});
	mw.watchEvents(respond);
	controlPoint = sio
		.of('/control')
		.on('connection', function (socket) {
			var hs = socket.handshake;
			var control = new Controller(hs.sessionID,socket,hs.session.renderer);
			if(hs.session.renderer){
				socket.join(hs.session.renderer);
			}
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

			socket.on('setmr',function(mrId){
				if(hs.session.renderer)
					socket.leave(hs.session.renderer);
				hs.session.renderer = mrId;
				socket.join(mrId);
				control.setRenderer(mrId);
				control.getStates();
				hs.session.save();
			});
			socket.on('getDevices',function(){
				var result = [];
				Object.keys(rendererList).forEach(function(elem){
					result.push(rendererList[elem].getRenderer());
				});
				socket.emit("deviceResults",result);
			});
			socket.on('playButton',function(){
				if(control.renderer){
					rendererList[control.renderer].playPause();
				}
			});
			socket.on('next',function(){
				console.log("NEXT");
				console.log(control.renderer);
				if(control.renderer){
					rendererList[control.renderer].playNext();
				}
			});
			socket.on('back',function(){
				console.log("BACK");
				if(control.renderer){
					rendererList[control.renderer].playNext(true);
				}
			});
			socket.on('play',function(trackId){
				control.play(trackId);
			});
			socket.on('getStates',function(){
				control.getStates();
			});
			socket.on('setSearch',function(criteria){
				control.setSearch(criteria);
			});
			socket.on('setSort',function(category){
				control.setSort(category);
			});
			socket.on('loadTracks',function(){
				control.getTrackList();
			});

			events.onStateChange(function(data){
				sio.of('/control').in(data.uuid).emit('stateChange',data);
			});
			events.onTrackChange(function(data){
				sio.of('/control').in(data.uuid).emit('trackChange',data);
			});
			events.onTrackListChange(function(data){
				socket.emit('newTracks',data);
			});
			events.onMRAdded(function(data){
				socket.emit('deviceAdded',data);
				socket.broadcast.emit('deviceAdded',data);
			});

			socket.on('disconnect', function () {
				  console.log('A socket with sessionID ' + hs.sessionID 
				      + ' disconnected!');
				  // clear the socket interval to stop refreshing the session
				  clearInterval(intervalID);
			});
	});
}


exports.addWebRenderer = function(uid,socket){
	rendererList[uid] = new WebRenderer(socket,uid,"testWebRenderer");
	mrAddedCB({uuid:uid,name:"testWebRenderer"});
}



exports.deviceData = function(callback){
	var result = [];
	Object.keys(rendererList).forEach(function(elem){
		result.push(rendererList[elem].getRenderer());
	});
	callback(result);
};

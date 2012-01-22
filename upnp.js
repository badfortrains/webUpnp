var BUFF_SIZE = 15;

var mediaWatcher = require('./media_watcher');
var mongodb = require('mongodb');
var BSON = mongodb.BSONPure;
var server = new mongodb.Server("127.0.0.1", 27017, {});
var db = new mongodb.Db('test', server);
db.open(function (error, client) {
  if (error) throw error;
  //db.dropDatabase(function(err, result) {
  	//collection = new mongodb.Collection(client, 'tracks');
  //});
});




var UpnpRenderer = function(uuid,name){
	this.uuid = uuid;
	this.name = name;
	this.listBuffer = [];
	this.nextTrack = 0;
}
UpnpRenderer.prototype = {
	BUFF_SIZE: 15,
	bufferRefill: function(){},
	stateChangeCB: function(){},
	playResultCB: function(){},
	stateChangeCB: function(){},
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
	play: function(trackId,callback){
			if(callback){
				this.playResultCB = callback;
			}else{
				callback = this.playResultCB;
			}
			var selected = this._makeCurrent();
			if(selected !== true)
				return callback({res: false,error: "Failed to select renderer"});
			db.collection("tracks",function(error,tracks){
				var o_id = new BSON.ObjectID(trackId);
				tracks.find({_id: o_id}).toArray(function(err, item){
					if(err){
						return callback({res: false,error: "Could not find track"});
					}
					mw.stop(function(resS){
						mw.open(function(resO){
							mw.play(function(resP){
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
	},
	setPlaylist: function(tracks){
			if(!tracks)
				this.listBuffer = [];
			else
				this.listBuffer = tracks; 
			this.nextTrack = 0;
	},
	playNext: function(){
		if(this.listBuffer.length > this.nextTrack){
		  this.play(this.listBuffer[this.nextTrack++]);
			if(this.nextTrack === BUFF_SIZE){
				this.bufferRefill(this.listBuffer[BUFF_SIZE-1]);
			}
		}
	},
	stateChanged: function(event){
		if(this[event.name] !== event.value){
 				if(event.value === "PLAYING" || event.value === "STOPPED" || event.value === "PAUSED_PLAYBACK" || event.name === "Mute" || event.name === "Volume"){
					this[event.name] = event.value;
					stateChangeCB(event);
				}
		}

	},
	getRenderer: function(){
		return({uuid: this.uuid, name: this.name});
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
				this.playResultCB(event.value);
			}else{
				this[event.name] = event.value;
			}
			event.uuid = this.uuid;
			this.stateChangeCB(event);
		}
	}.bind(this));
}
WebRenderer.prototype = UpnpRenderer.prototype;
WebRenderer.prototype.play = function(trackId, callback){
	if(callback){
		this.playResultCB = callback;
	}else{
		callback = this.playResultCB;
	}
	var that = this;
	db.collection("tracks",function(error,tracks){
		var o_id = new BSON.ObjectID(trackId);
		tracks.find({_id: o_id}).toArray(function(err, item){
			if(err || item.length === 0){
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
					break;
				}
			}
			if(i==length){
				return callback({res: false,error: "No mp3 file found"});
			}
		});
	});
};

//our binding to the platinum library 
var mw = new mediaWatcher.MediaWatcher();
var rendererList = [];
var stateChangeCB = function(){};
var bufferRefill = function(){};
var mrAddedCB = function(){};
var playResultCB = function(){};
var currentRenderer;




var respond = function (data){
	event = mw.pollEvent();
	while(event){
		if(event.name === "msAdd") {
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




var init = function () {
		mw.startUpnp(function(){});
		mw.watchEvents(respond);
	};



exports.getStates = function(target){
		rendererList[target].getStates();
};

exports.onStateChange = function(callback){
		UpnpRenderer.prototype.stateChangeCB = callback;
		WebRenderer.prototype.stateChangeCB = callback;
	};


exports.addWebRenderer = function(uid,socket){
	rendererList[uid] = new WebRenderer(socket,uid,"testWebRenderer");
	mrAddedCB({uuid:uid,name:"testWebRenderer"});
}

exports.onMRAdded = function(callback){
		mrAddedCB = callback;
	};

exports.deviceData = function(callback){
				//return callback(mw.getRenderers());
	var result = []	
	console.log("keys = ");
	console.log(Object.keys(rendererList)); 
	console.log("rendererList.length = "+rendererList.length);
	Object.keys(rendererList).forEach(function(elem){

		result.push(rendererList[elem].getRenderer());
	});
	callback(result);
};


exports.trackData = function(callback){
		db.collection("tracks",function(error,tracks){
			tracks.find({},{Artist:1,Album:1,Title:1,TrackNumber:1,_id:1}).sort({Artist: 1, Album: 1, TrackNumber: 1}).toArray(function(err, tracks){
				if (err) throw err;
				devices = mw.getRenderers();
				var state;
				if(devices.length > 0){
					var renderer = rendererList[devices[0].uuid];
					states = {
						mute: renderer.Mute,
						volume: renderer.Volume,
						playState: renderer.TransportState
					};
				}else{
					states = {
						mute: 0,
						volume: 0,
						playState: "Stopped"		
					};
				}
				return callback({tracks:tracks, title:'tracks test', devices: devices, state: states});
			});
		});
	};

exports.setPlaylist = function(tracks,target){
	var renderer = rendererList[target];
	if(renderer){
		renderer.setPlaylist(tracks);
	}
}

exports.onGetBuffer = function(callback){
		UpnpRenderer.prototype.bufferRefill = callback;
		WebRenderer.prototype.bufferRefill = callback;
}

exports.play = function(trackId,target,callback){
	rendererList[target].play(trackId,callback);
};
init();

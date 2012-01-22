define("playerModel",["dojo"], function(dojo){
	return dojo.declare("mediawatcher.playermodel", null, {
			constructor: function(){
				this.currentTrack = false;
				this.playlist = [];
				this.playIndex = 0;
				this.isPlaying = false;
				dojo.subscribe("mw/clickTrack", this, this.playTrack);

				dojo.subscribe("trackTable/tracksChanged",this, function(){
					if(this.currentTrack){
						dojo.publish("mw/getNextTracks",[this.currentTrack._id]);
					}
				});
				socket.on("getBuffer",function(currentTrack){
						dojo.publish("mw/getNextTracks",[this.currentTrack._id]);
				});
				dojo.subscribe("mw/nextTracks",this,this.getPlaylist);

/*
				socket.on("playResult",function(result){
					if(result.res){
						dojo.publish("player/play",[this.currentTrack]);
					}else{
						dojo.publish("error",result.error);
						currentTrack = false;
					}
				});
*/		
				socket.on("playResult",dojo.hitch(this,this.playResult));
				socket.on("stateChange",function(data){
						dojo.publish("player/stateChange",[data]);
				});


			},
			playResult: function(result){
				if(result.res){
					if(this.isPlaying)
						this.currentTrack = this.playlist[this.playIndex++];
					else
						this.isPlaying = true;
					dojo.publish("player/isPlaying",[this.currentTrack]);
				}
			},
			playTrack: function(data){
				this.currentTrack = data;
				this.isPlaying = false;
				socket.emit("play",data._id);
			},
			getPlaylist: function(data){
				socket.emit("setPlaylist",data.ids);
				this.playlist = data.tracks;
				this.playIndex = 0;
			}
	});
});

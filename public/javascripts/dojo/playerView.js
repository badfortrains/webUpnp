define("playerView",["dojo", "dojo/NodeList-traverse", "dojo/NodeList-dom"], function(dojo){
	return dojo.declare("mediawatcher.playerview", null, {
			constructor: function(el){
				this.el = el;
				var html = 'Mute:<span id="muteState"></span><br>';
				html += 'Volume:<span id="volumeLvl"></span><br>';
				html += 'PlayState:<span id="playState"></span><br>';
				html += 'Current Track:<span id="mediaInfo"></span><br>';
				this.el.innerHTML = html;
			
				dojo.subscribe("player/stateChange",this,this.stateChange);
			  dojo.subscribe("player/isPlaying",this,this.playTrack);
			},
			stateChange: function(data){
				if(data.name === "Mute")
					dojo.byId("muteState").innerHTML = data.value;
				else if(data.name == "Volume")
					dojo.byId("volumeLvl").innerHTML = data.value;
				else if(data.name == "TransportState"){
					dojo.byId("playState").innerHTML = data.value;
					//if(data.value === "STOPPED" || data.value === "UNKNOWN_NEXT"){
					//	dojo.byId("mediaInfo").innerHTML = "";
					//}
				}
			},
			playTrack: function(data){
				dojo.byId("playState").innerHTML = "PLAYING";
				dojo.byId("mediaInfo").innerHTML = data.Title + " - " + data.Artist + " - " + data.Album;
			}
	});
});


define("upnp/playerView",["dojo", "dojo/NodeList-traverse", "dojo/NodeList-dom"], function(dojo){
	return dojo.declare("mediawatcher.playerview", null, {
			constructor: function(el){
				this.el = el;
				var html = '<span id="mediaInfo"></span><br>';
			//	html += 'Volume:<span id="volumeLvl"></span><br>';
			//	html += 'PlayState:<span id="playState"></span><br>';
			//	html += 'Mute:<span id="muteState"></span>';
				html += '<div id="playControls" class="disabled"><a href="#" id="back">Back</a>';
				html += '|<a href="#" id="playButton">Play</a>';
				html += '|<a href="#" id="next">Next</a></div>';
				this.el.innerHTML = html;
				
				dojo.connect(dojo.byId("back"),"onclick",function(){
					dojo.publish("player/back");
				});
				dojo.connect(dojo.byId("next"),"onclick",function(){
					dojo.publish("player/next");
				});
				dojo.connect(dojo.byId("playButton"),"onclick",function(){
					dojo.publish("player/playButton");
				});

				dojo.connect(dojo.byId("mediaInfo"),"onclick",function(){
					var selected = dojo.query(".selected");
					if(selected.length){
						selected[0].scrollIntoView();
					}
				});



				dojo.subscribe("player/stateChange",this,this.stateChange);
			  dojo.subscribe("player/isPlaying",this,this.playTrack);

			},
			stateChange: function(data){
				//if(data.name === "Mute")
				//	dojo.byId("muteState").innerHTML = data.value;
				//else if(data.name == "Volume")
				//	dojo.byId("volumeLvl").innerHTML = data.value;
				//else if(data.name == "TransportState"){
				//	dojo.byId("playState").innerHTML = data.value;
				if(data.value === "PAUSED_PLAYBACK"){
					dojo.replaceClass(dojo.byId("playControls"),"enabled","disabled");
					dojo.byId("playButton").innerHTML = "Play";
				}else if(data.value === "PLAYING"){
					dojo.replaceClass(dojo.byId("playControls"),"enabled","disabled");
					dojo.byId("playButton").innerHTML = "Pause";
				}else if(data.value === "STOPPED"){
						dojo.replaceClass(dojo.byId("playControls"),"disabled","enabled");
						dojo.byId("playButton").innerHTML = "Play";
						dojo.byId("mediaInfo").innerHTML = "";
				}
			},
			playTrack: function(data){
				dojo.byId("mediaInfo").innerHTML = data.Title + " - " + data.Artist + " - " + data.Album;
			}
	});
});


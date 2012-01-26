define("upnp/playerModel",["dojo"], function(dojo){
	return dojo.declare("mediawatcher.playermodel", null, {
			constructor: function(){
				socket.on("trackChange",function(track){
					dojo.publish("player/isPlaying",[track]);
				});
				socket.on("stateChange",function(data){
						dojo.publish("player/stateChange",[data]);
				});
				dojo.subscribe("player/back",function(){
						socket.emit("back");
				});
				dojo.subscribe("player/next",function(){
						socket.emit("next");
				});
			}
	});
});

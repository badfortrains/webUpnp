define("upnp/trackModel",["dojo","dojo/store/Memory"], function(dojo,memory){
	return dojo.declare("mediawatcher.trackmodel", null, {
			constructor: function(){

				dojo.subscribe("trackTable/sort",function(category){
					dojo.publish("trackTable/loading");
					socket.emit("setSort",category);
				});
				dojo.subscribe("trackTable/search",this, function(searchObj){
					dojo.publish("trackTable/loading");
					socket.emit("setSearch",searchObj);
				});

				dojo.subscribe("trackTable/clearSearch",this,function(){
					dojo.publish("trackTable/loading");
					socket.emit("setSearch",{});
				});
				dojo.subscribe("trackTable/trackClick",this,function(id){
						socket.emit("play",id);
				});
				socket.on("newTracks",function(data){
						dojo.publish("trackTable/tracksChanged",[data]);
				});	
				socket.on("newArtists",function(data){
						dojo.publish("trackTable/artistsChanged",[data]);
				});	
				dojo.publish("trackTable/loading");
				socket.emit("loadTracks");
				//socket.emit("getArtists");
			}
	});
});

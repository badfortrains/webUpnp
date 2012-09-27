define("upnp/artistView",["dojo", "dojo/NodeList-traverse", "dojo/NodeList-dom"], function(dojo){
	return dojo.declare("mediawatcher.artistview", null, {
			constructor: function(el){
				this.el = el;
				this.categories=[{name:"Title",id:"track_titles"},{name:"Album",id:"album_titles"}];

				/*
				dojo.connect(dojo.byId("sorts"),"onclick",this,function(evt){
					var closest = dojo.query(evt.target).closest("span.sort");
					if (closest.length) {
						var category = this.columns[dojo.query("span.sort").indexOf(closest[0])];
						dojo.publish("trackTable/sort",category);
		      }
				});*/
/*
				dojo.connect(dojo.byId("clearSearch"),"onclick",function(evt){
					dojo.publish("trackTable/clearSearch");
				});
*/
				dojo.subscribe("trackTable/loading",this, this.loading);
				dojo.subscribe("trackTable/artistsChanged",this, this.render);
				dojo.subscribe("trackTable/tracksChanged",this, this.renderTracks);
			},
			trackClick: function(evt){
				var closest = dojo.query(evt.target).closest("tbody tr");
				if (closest.length) {
					dojo.publish("trackTable/trackClick",closest.attr("id"));
        }
			},
			artistClick: function(evt){
				var closest = dojo.query(evt.target).closest("tbody td");
				if (closest.length) {
					var name = closest[0].innerHTML.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>').replace(/\&quot\;/g, '"').replace(/\&amp\;/g, "&");
					dojo.publish("trackTable/search",{query: {"Artist":name}});
        }
				
			},
			loading: function(){
				dojo.query(".progress").replaceClass("loading","not-loading");
			},

			render: function(data){
				var letter = 65;
				var html = "<ul id='track-list'>";
				dojo.forEach(data.Artists,function(entry,i){
					
					if(entry._id.toUpperCase().charCodeAt(0) >= letter){
						letter = entry._id.toUpperCase().charCodeAt(0);
						html += '<li class="find"><div class="abc-box"></div><input></input></li>';
						html += '<li><a name="abc'+String.fromCharCode(letter)+'"></a>'+entry._id+"</li>";
						letter++;
					}else{
						html += "<li>"+entry._id+"</li>";
					}
				});
				html += "</ul>";
				
				dojo.query(".progress").replaceClass("not-loading","loading");		
				this.el.innerHTML = html;
				if(data.currentTrack){
					dojo.publish("player/isPlaying",data.currentTrack);
				}
				dojo.connect(dojo.byId("artistTable"),"onclick",this,this.artistClick);
			},
			renderTracks: function(data){
				dojo.forEach(this.categories,function(cat){
						var html = '<table id="'+cat.name+'_Table"><tbody>';
						dojo.forEach(data.tracks,function(entry,i){
							html += '<tr id="'+entry._id+'">';
							html += "<td>"+entry[cat.name]+"</td></tr>";
						});
						html += "</tbody></table>";
						dojo.byId(cat.id).innerHTML = html;
				});		
				dojo.query(".progress").replaceClass("not-loading","loading");		
				if(data.currentTrack){
					dojo.publish("player/isPlaying",data.currentTrack);
				}
				//hack
				dojo.connect(dojo.byId("Title_Table"),"onclick",this,this.trackClick);
		  }
	});
});


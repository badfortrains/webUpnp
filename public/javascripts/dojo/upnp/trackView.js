define("upnp/trackView",["dojo", "dojo/NodeList-traverse", "dojo/NodeList-dom"], function(dojo){
	return dojo.declare("mediawatcher.trackview", null, {
			constructor: function(el){
				this.columns = ["Title","Artist","Album","TrackNumber"];
				this.el = el;
				dojo.byId("trackSearch").innerHTML = '<input type="text" id="searchInput"></input><a href="#" id="doSearch">search</a><a href="#" id="clearSearch" >clear</a><div class="progress not-loading"></div>';
				dojo.connect(this.table,"onclick",this,this.trackClick);

				dojo.connect(dojo.byId("doSearch"),"onclick",function(evt){
					dojo.publish("trackTable/search",{criteria:[dojo.byId("searchInput").value]});
				});
				dojo.connect(dojo.byId("sorts"),"onclick",this,function(evt){
					var closest = dojo.query(evt.target).closest("span.sort");
					if (closest.length) {
						var category = this.columns[dojo.query("span.sort").indexOf(closest[0])];
						dojo.publish("trackTable/sort",category);
		      }
				});
				dojo.connect(dojo.byId("clearSearch"),"onclick",function(evt){
					dojo.publish("trackTable/clearSearch");
				});

				dojo.subscribe("trackTable/loading",this, this.loading);
				dojo.subscribe("trackTable/tracksChanged",this, this.render);
				dojo.subscribe("player/isPlaying",function(track){
					var old = dojo.query(".selected");
					if(old.length){
						dojo.removeClass(old[0],"selected");
					}
					old = dojo.byId(track._id)
					if(old){
						dojo.addClass(old,"selected");
					}
				});
				dojo.subscribe("player/stopped", function(){
					var selected = dojo.query(".selected");
					if(selected.length){
						dojo.removeClass(selected[0],"selected");
					}
				});
			},

			trackClick: function(evt){
				var closest = dojo.query(evt.target).closest("tbody tr");
				if (closest.length) {
					
					dojo.publish("trackTable/trackClick",closest.attr("id"));
        }
				
			},
			loading: function(){
				dojo.query(".progress").replaceClass("loading","not-loading");
			},

			render: function(data){
				var letter = 65;
				var html = "<table>";
				dojo.forEach(data.tracks,function(entry,i){
					html += '<tr id="'+entry._id+'">';
					html += "<td>";
					if(entry.Artist.toUpperCase().charCodeAt(0) >= letter){
						letter = entry.Artist.toUpperCase().charCodeAt(0);
						html += '<a name="abc'+String.fromCharCode(letter)+'"></a>';
						letter++;
					}
					html += entry.Title+"</td>"+"<td>"+entry.Artist+"</td>"+"<td>"+entry.Album+"</td>"+"<td>"+entry.TrackNumber+"</td></tr>";
				});
				html += "</tbody></table>";
				
				dojo.query(".progress").replaceClass("not-loading","loading");		
				this.el.innerHTML = html;
				html = "";
				dojo.forEach(this.columns, function(entry, i){
					cs = dojo.getComputedStyle(dojo.query("tbody:first-child td")[i]).width;
					if(entry  === "TrackNumber")
						entry = "#"
					html += "<span class='sort' style='display: inline-block; width:"+cs+"'>"+entry+"</span>";
				});
				dojo.byId("tableHeaders").innerHTML = html;
				if(data.currentTrack){
					dojo.publish("player/isPlaying",data.currentTrack);
				}
				
			}

	});
});


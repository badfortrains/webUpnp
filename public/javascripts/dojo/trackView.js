define("trackView",["dojo", "dojo/NodeList-traverse", "dojo/NodeList-dom"], function(dojo){
	return dojo.declare("mediawatcher.trackview", null, {
			constructor: function(el){
				this.columns = ["Title","Artist","Album","TrackNumber"];
				this.el = el;
				this.el.innerHTML = '<input type="text" id="trackSearch"></input><a href="#" id="doSearch">search</a><a href="#" id="clearSearch" >clear</a><div id="tableContainer"></div><div class="progress not-loading"></div>';
				this.table = dojo.byId("tableContainer");	
				dojo.connect(this.table,"onclick",this,this.trackClick);

				dojo.connect(dojo.byId("doSearch"),"onclick",function(evt){
					dojo.publish("trackTable/search",[dojo.byId("trackSearch").value]);
				});
				dojo.connect(dojo.byId("sorts"),"onclick",this,function(evt){
					var closest = dojo.query(evt.target).closest("th.sort");
					if (closest.length) {
						var category = this.columns[dojo.query("th.sort").indexOf(closest[0])];
						dojo.publish("trackTable/sort",category);
		      }
				});
				dojo.connect(dojo.byId("clearSearch"),"onclick",function(evt){
					dojo.publish("trackTable/clearSearch");
				});

				dojo.subscribe("trackTable/loading",this, this.loading);
				dojo.subscribe("trackTable/tracksChanged",this, this.render);
			},

			trackClick: function(evt){
				var closest = dojo.query(evt.target).closest("tbody tr");
				if (closest.length) {
					dojo.publish("trackTable/trackClick",closest.attr("id"));
        }
				
			},
			loading: function(){
				dojo.query(".progress",this.el).replaceClass("loading","not-loading");
			},

			render: function(data){
				var letter = 65;
				var html = "";
				html += "<table><thead id='sorts'><tr>";
				dojo.forEach(this.columns, function(entry, i){
					html += "<th class='sort'>";
					if(i === 0){
						html += "<a name='abc#'></a>";
					}
					html += entry+"</th>";
				});
	
				html += "</tr></thead><tbody>";
				dojo.forEach(data,function(entry,i){
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
				
				dojo.query(".progress",this.el).replaceClass("not-loading","loading");		
				this.table.innerHTML = html;

				
			}

	});
});


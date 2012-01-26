define("upnp/deviceView",["dojo", "dojo/NodeList-traverse", "dojo/NodeList-dom"], function(dojo){
	return dojo.declare("mediawatcher.trackview", null, {
			constructor: function(el){
				this.el = el;
				var html = '<ul id="rendererList"></ul>'
				this.el.innerHTML = html;
				this.ul = dojo.byId("rendererList");
				dojo.subscribe("deviceList/gotDevices",this,this.render);
				dojo.subscribe("deviceList/addDevice",this,this.addDevice);
			},

			deviceClick: function(evt){
				var closest = dojo.query(evt.target).closest("li");
				if (closest.length) {
					//attr("id") returns an array, so we don't need to warp it
					dojo.publish("deviceList/setmr",closest.attr("id"));
        	console.log("li clicked id="+closest.attr("id"));
        }
			},
			addDevice: function(entry){
			 		html = '<li id="'+entry.uuid+'">';
					html += entry.name + "</li>";	
					dojo.place(html, this.ul, "last");
				  alert("new device added");
			},	
		
			render: function(data){
				var html = "";
				dojo.forEach(data,function(entry,i){
					html += '<li id="'+entry.uuid+'">';
					html += entry.name + "</li>";
				});
				
				this.ul.innerHTML = html;

				dojo.connect(this.el,"onclick",this,this.deviceClick);
			}

	});
});


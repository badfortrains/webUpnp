define("deviceModel",["dojo"], function(dojo){
	return dojo.declare("mediawatcher.trackmodel", null, {
			constructor: function(){
				this.devices=[];
				socket.emit("getDevices");
				socket.on("deviceResults",function(devices){
					this.devices = devices;
					dojo.publish("deviceList/gotDevices",[devices]);
				}.bind(this));
				socket.on("deviceAdded",function(device){
					this.devices.push(device);
					dojo.publish("deviceList/addDevice",[device]);
				}.bind(this));
				dojo.subscribe("deviceList/setmr",this.setmr);
			},
			
			setmr: function(id){
				socket.emit("setmr",id);
		 	}
	});
});

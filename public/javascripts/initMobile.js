if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
                                 ? this
                                 : oThis || window,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


var	socket;

require(["dojo/ready","upnp/playerView","upnp/playerModel","upnp/artistView", "upnp/trackModel","upnp/deviceView","upnp/deviceModel","dojo/_base/xhr","dojo/dom"], function(ready,PlayerView,PlayerModel,ArtistView,TrackModel,DeviceView,DeviceModel,xhr,dom){
	ready(init);
	

	function init(){
		socket = io.connect('/control');
		var tview = new ArtistView(dom.byId("trackTable"));
		var tmodel = new TrackModel();
		var dview = new DeviceView(dom.byId("devicesContainer"));
		var dmodel = new DeviceModel();
		var pmodel = new PlayerModel();
		var pview = new PlayerView(dom.byId("playerContainer"));

	}
	

});

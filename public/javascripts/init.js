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

require(["dojo/ready","playerView","playerModel","trackView", "trackModel","deviceView","deviceModel","dojo/_base/xhr","dojo/dom"], function(ready,PlayerView,PlayerModel,TrackView,TrackModel,DeviceView,DeviceModel,xhr,dom){
	ready(init);
	

	function init(){
		socket = io.connect('http://192.168.1.12/control');
		var tview = new TrackView(dom.byId("trackTable"));
		var tmodel = new TrackModel();
		var dview = new DeviceView(dom.byId("devicesContainer"));
		var dmodel = new DeviceModel();
		var pmodel = new PlayerModel();
		var pview = new PlayerView(dom.byId("playerContainer"));
		dojo.query(".letters li").on("mouseover",function(evt){
			dojo.query(".selectBox").toggleClass("hidden");
			dojo.query(".selectBox")[0].innerHTML = evt.target.innerHTML;
		});
		dojo.query(".letters li").on("mouseout",function(evt){
			dojo.query(".selectBox").toggleClass("hidden");
		});
		dojo.query(".letters li").on("mouseup",function(evt){
			window.location.hash="abc"+evt.target.innerHTML;
		});



	}
	

});

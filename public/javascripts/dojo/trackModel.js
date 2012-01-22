define("trackModel",["dojo","dojo/store/Memory"], function(dojo,memory){
	return dojo.declare("mediawatcher.trackmodel", null, {
			constructor: function(){
				this.data = [];
				this.getTracks();
				this.bufferCount = 15;
				this.activeSearch = "";
				this.sort = "Artist"
				this.cols = ["Artist","Title","Album","TrackNumber"];
				this.searchOrders = {
					Artist: [{attribute:"Artist"},{attribute:"Album"},{attribute:"TrackNumber"}],
					Album: [{attribute:"Album"},{attribute:"TrackNumber"}],
					Title: [{attribute:"Title"}],
					ArtistDes: [{attribute:"Artist",descending:true},{attribute:"Album",descending:true},{attribute:"TrackNumber",descending:true}],
					AlbumDes: [{attribute:"Album",descending:true},{attribute:"TrackNumber",descending:true}],
					TitleDes: [{attribute:"Title",descending:true}]
				};
				dojo.subscribe("trackTable/search",this, this.searchFor);
				dojo.subscribe("trackTable/sort",this, this.sortBy);
				dojo.subscribe("trackTable/clearSearch",this,function(){
					if(this.activeSearch !== ""){
						this.activeSearch = "";
						dojo.publish("trackTable/tracksChanged",[this.findTracks()]);
					}
				});
				dojo.subscribe("trackTable/trackClick",this,function(id){
					dojo.publish("mw/clickTrack",this.data.query({_id:id}));
					//publish nextTracks too, since we're playing something new
					this.nextTracks(id);
				});
				dojo.subscribe("mw/getNextTracks",this,this.nextTracks);
			},
			
			nextTracks: function(id){		
				function findId(collection,uid){
					var length;
					length = collection.length;
					for(var i=0;i<length;i++){
						if(collection[i]._id === uid)
							return i;
					}
					return false;
				}
				var tracks = this.findTracks();
				var index = findId(tracks,id);
				if(index === false)
					return [];
				var end = this.bufferCount + index + 1,
					newTracks = [],
					ids = [];
				if(end > tracks.length){
					end = tracks.length;
				}
				for(var i=index+1; i<end; i++){
					ids.push(tracks[i]._id);
					newTracks.push(tracks[i]);
				}
				dojo.publish("mw/nextTracks", [{ids:ids,tracks:newTracks}]);
			},		

			findTracks: function(){
				var tracks;
				if(this.activeSearch !== ""){
					tracks = this.data.query(dojo.hitch({cols:this.cols,criteria:this.activeSearch}, function(item){
						return dojo.some(this.cols, function(property){
								if(!this.item[property].indexOf){
									console.log(item);
								}
								return (this.item[property].indexOf && this.item[property].indexOf(this.criteria) != -1);
						},{item: item,criteria: this.criteria});								
					}),{sort: this.searchOrders[this.sort]})
				}else{
					tracks = this.data.query({},{sort: this.searchOrders[this.sort]});
				}
				return tracks;
			},

			searchFor: function(criteria){
				this.activeSearch = criteria;
				dojo.publish("trackTable/tracksChanged",[this.findTracks()]);
			},
			sortBy: function(category){
				this.sort = category;
				dojo.publish("trackTable/tracksChanged",[this.findTracks()]);
			},
			getTracks: function(sortBy){
				var xhrArgs = {
				  url: "getTracks?sortBy="+sortBy,
				  handleAs: "json",
				  load: dojo.hitch(this,function(data){
						this.data = new memory({data: data});
						dojo.publish("trackTable/tracksChanged",[data]);
      		}),
		    	error: function(error){
						dojo.publish("trackTable/error",["Error loading track data"]);
				    //console.log( "An unexpected error occurred: " + error);
		    	}
    		}
				// Call the asynchronous xhrGet
				dojo.publish("trackTable/loading");
				var deferred = dojo.xhrGet(xhrArgs);
			}

	});
});

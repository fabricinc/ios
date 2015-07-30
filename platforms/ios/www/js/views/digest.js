var DigestModel = Backbone.Model.extend({

});


var DigetstItems = Backbone.Collection.extend({

	model: DigestModel,

});

var DigestSection = Backbone.View.extend({

	initialize: function(items){
	
		this.collection = new DigestModel(items); 

		console.log(this.collection);
		console.log(React);
	
	},
	render: function(){
	
		console.log('render Digest');

		return this;
	
	},
});

var DigestHeader = Backbone.View.extend({

	initialize: function(){
	
		 
	
	},

	render: function(){
	
		

		return this;  
	
	},
});
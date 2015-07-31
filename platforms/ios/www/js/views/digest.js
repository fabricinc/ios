var DigestModel = Backbone.Model.extend({

});


var DigestItems = Backbone.Collection.extend({

	model: DigestModel,

});

var DigestSection = Backbone.View.extend({

	el: "#content-container .content-scroller",

	initialize: function(items){

		this.collection = new DigestItems(items); 

	
	},
	render: function(){

		// empty out the div
		this.$el.empty();
	
		// Create Header


		// Create items
		this.collection.each(this.addOne, this);


		return this;
	
	},

	addOne: function(digestItem, i){
	
		// Add index as count to model
		// to show item numbers
		digestItem.set('count', i);

		var item = new DigestItem({ model: digestItem });

		this.$el.append( item.render().el );
	
	},
});


var DigestHeader = Backbone.View.extend({

	initialize: function(){
	
		 
	
	},

	render: function(){
	
		

		return this;  
	
	},
});



var DigestItem = Backbone.View.extend({

	className: '.digest-item',

	initialize: function(){
	
		 
	
	},

	render: function(){
		

		// Create Content
		var content = new DigestItemContent({ model: this.model });

		this.$el.append( content.render().el );

		// Create Footer

		return this;
	
	},
});

var DigestItemContent = Backbone.View.extend({

	className: 'digest-item-content',
	
	render: function() {

		var model = this.model.toJSON();
		var digestData = JSON.parse(model.data);
		var headerModel = {
			icon: model.column_type === "clip" ? digestData.typeTitle : model.column_type,
			typeTitle: model.column_type === "people" ? "Friends" : digestData.typeTitle,
			contentTitle: digestData.objectTitle, 
			columnType: model.column_type,
			count: model.count
		};

		console.log( model );

		// Create Header
		var contentHeader = new DigestItemHeader({ model: headerModel });


		// Create Image
		var img = new DigestImage({ model: { src: digestData.objectImg }});
		
		this.$el
			.append( contentHeader.render().el )
			.append( img.render().el );


		return this;
	},

});

var DigestItemHeader = Backbone.View.extend({
	
	className: 'digest-item-content-header',

	render: function() {

		
		var titles = this.model;

		

		this.$el.append('<img src="images/discovery/categoryIcons/' + titles.icon + '.png" /><h1>' + titles.typeTitle +'</h1><h2>' + titles.contentTitle + '</h2><p>' + (titles.count  + 1) + '</p>');
		
		
		return this;
	},

});


var DigestImage = Backbone.View.extend({
	
	className: 'digest-content-img',

	render: function() {

		this.$el.html("<img src='" + this.model.src + "' />");
		
		return this;
	},

});







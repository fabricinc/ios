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

	className: 'digest-item',

	initialize: function(){
	
		 
	
	},

	render: function(){
		

		// Create Content
		var content = new DigestItemContent({ model: this.model });


		// Create Footer
		var contentFooter = DigestItemFooter({});

		// Put them on the page
		this.$el.append( content.render().el );

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


		// Create Header
		var contentHeader = new DigestItemHeader({ model: headerModel });


		// Create Image
		var img = new DigestImage({ model: { src: digestData.objectImg }});
		
		this.$el
			.append( contentHeader.render().el )
			.append( img.render().el );

		// Create Shopping links if its a clip
		if(model.column_type === "clip") {

			var purchaseLinks = new PurchaseLinks(digestData.links);

			this.$el.append( purchaseLinks.render().el );
			

		}


		return this;
	},

});

var DigestItemHeader = Backbone.View.extend({
	
	className: 'digest-item-content-header',

	render: function() {

		
		var titles = this.model;


		this.$el.append('<img class="digest-icon" src="images/discovery/categoryIcons/' + titles.icon + '.png" /><h1>' + titles.typeTitle +'</h1><h2>' + titles.contentTitle + '</h2><p>' + (titles.count  + 1) + '.</p>');
		
		
		return this;
	},

});


var DigestImage = Backbone.View.extend({
	
	className: 'digest-content-img',
	tagName: 'img',

	render: function() {
		this.el.src = this.model.src;
		// this.$el.html("<img src='" + this.model.src + "' />");
		
		return this;
	},

});

var LinkModel = Backbone.Model.extend({

	defaults: {
		name: null,
		link: null,
	}

});

var Links = Backbone.Collection.extend({
	model: LinkModel,


	validateModels: function() {

		this.remove(this.filter(function(model) {

			return !model.get('link');

		}));

	},
});



var PurchaseLinks = Backbone.View.extend({
	className: 'purchase-links',

	initialize: function(links){

		this.collection = new Links(links);
		this.collection.validateModels();
	
	},

	render: function() {

		if(this.collection.length) {
			this.$el.prepend("<p>Available on:</p>");
			this.collection.each(this.addOne, this);
		}
		
		return this;
	},

	addOne: function(link){
	
		purchaseLink = new PurchaseLink({ model: link }) ;

		this.$el.append( purchaseLink.render().el );
	
	},

});

var PurchaseLink = Backbone.View.extend({
	tagName: "a",
	
	render: function() {

		this.el
			.className = this.model.get('name')
			.href = this.model.get('link');
		
		return this;
	},

});







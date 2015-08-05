var DigestModel = Backbone.Model.extend({

	initialize: function(){
	

		this.set('favorite', !!parseInt(this.get('favorite')));
		this.set('favoriteID', APP.gameState.favoriteListID);
		this.set('digestData', JSON.parse(this.get('data')));
		this.set('queue', !!parseInt(this.get('queue')));
		this.set('done', !!parseInt(this.get('done')));
		this.set('queueID', APP.gameState.watchListID);

	
	},

	handleInteraction: function(element){

 		var el = element.split(" ")[0],
 			listID = parseInt(this.get(el +'ID')),
 			setter = this.get(el);


		switch(el){
			case 'favorite':
			case 'queue': 

				Api.setMovieToFabricList(parseInt(this.get('object_id')), listID, !setter);

				this.set(el, !setter);

				break;
				
		}

 		
	
	},

	imageClick: function(){
	
		if( this.get('column_type') === 'clip' ) {}

		switch(this.get('column_type')){
			case 'clip':
				console.log( 'play clip' );
				break;
			case 'people':
			case 'pack':
				Backbone.history.navigate("discovery?categoryID=" +  this.get('digestData').categoryID + "&listID=null", true);
		}
	
	},
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
		this.$el
			.empty()
			.removeClass('loading');
	
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

	render: function(){
		
		console.log( this.model.toJSON() );

		// Create Content
		var content = new DigestItemContent({ model: this.model });


		var footer = "";

		// Create Footer
		if(this.model.get('column_type') !== 'people'){

			footer = new DigestItemFooter({ model: this.model }).render().el;

		}

		// Put them on the page
		this.$el
			.append( content.render().el )
			.append( footer );

		return this;
	
	}
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
		var img = new DigestImage({ model: this.model });
		
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

var DigestItemFooter = Backbone.View.extend({

	className: 'content-item-footer',

	render: function() {

		var footer = this.footerLoader();

		this.$el.append( footer );

		
		return this;
	},

	footerLoader: function(){
	
		switch (this.model.get('column_type')) {
			case "pack":
				return new PackFooter({ model: this.model }).render().el;

			case "people":
				return "";

			default:
				return new ClipFooter({ model: this.model }).render().el;

		}
	
	},

});

var PackFooter = Backbone.View.extend({

	className: "pack-footer",

	tagName: "h1",

	events: {
		'click': 'categoryFilter',
	},

	render: function() {

		this.$el.append("See more packs");
		
		return this;
	},

	categoryFilter: function(){
	
		$('#category-filter').click();
	
	},

});

var ClipFooter = Backbone.View.extend({

	className: 'clip-footer',

	events: {
		'click .favorite': 'interaction',
		'click .queue': 'interaction',
	},

	initialize: function(attributes){
	
		this.listenTo(this.model, 'change:favorite', this.favoriteButton);
		this.listenTo(this.model, 'change:queue', this.queueButton);

	
	},
	
	render: function() {

		this.$el
			.append( '<div class="favorite'+ (this.model.get("favorite") ? " active" : "") +'"></div>' )
			.append( '<div class="queue'+ (this.model.get("queue") ? " active" : "") +'"></div>' )
			.append( '<div class="share"></div>' );

		return this;

	},

	interaction: function(element){
	
		this.model.handleInteraction(element.currentTarget.className);
	
	},

	favoriteButton: function(){
		
		this.$('.favorite').toggleClass('active');
	
	},

	queueButton: function(){
	
		this.$('.queue').toggleClass('active');
	
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

	events: {
		'click' : 'navigate',
	},

	render: function() {

		this.el.src = this.model.get('digestData').objectImg;
		
		return this;
	},

	navigate: function(){
	
		this.model.imageClick();	
	},

});

var LinkModel = Backbone.Model.extend({

	defaults: {
		name: null,
		link: null,
	},

	shoppingLink: function(e){
	

		Util.handleExternalUrl( e );
	
	},

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

			this.$el.prepend("<span class='available-on'>Available On</span>");
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

	events: {
		'click': 'purchaseLink'
	},
	
	render: function() {

		var name = this.model.get('name').toLowerCase();

		this.$el.attr({ 
			'href' : this.model.get('link'),
			'data-vendor': name,
			'target': '_blank',
			'class': name
		});

		
		return this;
	},

	purchaseLink: function(e){
		
		this.model.shoppingLink(e.currentTarget);
	
	},

});







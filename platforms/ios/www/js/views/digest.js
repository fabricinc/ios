var DigestModel = Backbone.Model.extend({

	initialize: function(){
	

		this.set('favorite', !!parseInt(this.get('favorite')));
		this.set('favoriteID', APP.gameState.favoriteListID);
		this.set('digestData', JSON.parse(this.get('data')));
		this.set('queue', !!parseInt(this.get('queue')));
		this.set('done', !!parseInt(this.get('done')));
		this.set('queueID', APP.gameState.watchListID);
		this.set('recommendation', this.get('digestData').recommendation);
		this.set('typeTitle', this.get('column_type') === "people" ? "Friends" : this.get('digestData').typeTitle);

		var icon = this.get('column_type') === 'clip' ? this.get('digestData').typeTitle : this.get('column_type');
		this.set('icon', 'images/discovery/categoryIcons/' + icon + '.png');
		
		switch(this.get('typeTitle')){
			case 'Music':
				this.set('track', new Audio(this.get('digestData').clip));
				break;
			case 'Movie': 
				this.set('track', this.createVideo(this.get('digestData').clip));

		}


	},

	createVideo: function(clip){

		console.log( 'create video' );
		var video = document.createElement("VIDEO");

		video.src = clip;

		return video;
	
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

		switch(this.get('column_type')){
			case 'clip':
				this.collection.handlePlayback( this.get('track') );
				break;
			case 'people':
				Backbone.history.navigate("matches", true);
				break;
			case 'pack':
				Backbone.history.navigate("discovery?categoryID=" +  this.get('digestData').categoryID + "&listID=null", true);
		}
	
	},

	playClip: function(clip){

		if(this.get('typeTitle') === 'Music') {
			// if()
			this.get('track').play();
		}
		console.log( clip ); 
	
	},
});


var DigestItems = Backbone.Collection.extend({

	model: DigestModel,

	playing: false,

	tack: null,

	handlePlayback: function( track ){
		

		if(!track) { return; }

		console.log( this );
		
		if(this.playing){

			if (this.track === track) {

				console.log( 'same track PAUSE' );

				// pause track
				this.pause();

				// Set play status on collection
				this.updatePlayStatus();

			} else { 		// Set new track

				// Pause old track
				this.pause();

				// Switch to new track
				this.setTrack( track );

				// Play new track
				this.play();

			}
			
			
		} else { 	//Not playing any tracks

			this.setTrack( track );

			this.play();

			this.updatePlayStatus();
		}

	},

	setTrack: function(newTrack){
	
		this.track = newTrack;

		this.track.addEventListener('ended', function() {
			this.updatePlayStatus.call(this);
		}.bind(this));
	
	},

	play: function(){

		this.track.play();
	
	},

	pause: function(){
	
		this.track.pause();
	
	},

	updatePlayStatus: function(){
		console.log( 'update play status' );
		 this.playing = !this.playing;

		 console.log( this );
	
	},

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

		console.log( model );
		
		var digestData = JSON.parse(model.data);
		
		var headerModel = {
			icon: model.column_type === "clip" ? digestData.typeTitle : model.column_type,
			typeTitle: model.column_type === "people" ? "Friends" : digestData.typeTitle,
			contentTitle: digestData.objectTitle, 
			columnType: model.column_type,
			count: model.count
		};


		// Create Header
		var contentHeader = new DigestItemHeader({ model: this.model });


		// Create Image
		var img = new DigestImage({ model: this.model });
		
		this.$el
			.append( contentHeader.render().el )
			.append( img.render().el );


		// Create Shopping links if its a clip
		if(model.column_type === "clip") {

			// Create recommendation section if applicable 
			if( this.model.get('recommendation') ){

				var recommendation = new Recommendation({ model: this.model });

				this.$el.append( recommendation.render().el );
			}

			var purchaseLinks = new PurchaseLinks(this.model.get('digestData').links);

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

		this.$el.append("See more packs<span>&#10142;</span>");
		
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
			.append( '<div class="queue'+ (this.model.get("queue") ? " active" : "") +'"></div>' );

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

var Recommendation = Backbone.View.extend({
	className: 'digest-recommendation',

	render: function() {

		var rec = this.model.get('recommendation'),
			facebookID = rec.facebookID || null,
			userID = rec.userID || "",
			name = rec.userName || "";

		console.log( rec );

		var avatar = new Avatar({ src: facebookID });

		this.$el
			.append( avatar.render().el )
			.append('<h3><span class="bold">'+ name.split(" ")[0] +'</span> recommends this</h3>');
		
		return this;
	},

});

var Avatar = Backbone.View.extend({

	className: 'digest-avatar',

	tagName: 'img',

	initialize: function(options){

		this.el.src = options.src 
			? "https://graph.facebook.com/"+ options.src +"/picture?height=170&width=170" 
			: "images/discovery/avatar.png";
		
	},

	render: function() {
		
		return this;

	},

});

var DigestItemHeader = Backbone.View.extend({
	
	className: 'digest-item-content-header',

	render: function() {

		var icon = new DigestIcon({ src: this.model.get('icon') });
		var objectTitle = new ObjectTitle({ model: this.model });
		var title = new DigestTitle({ model: this.model });

		this.$el
			.append( icon.render().el )
			.append( title.render().el )
			.append( objectTitle.render().el )
			.append('<p>' + (this.model.get('count') + 1) + '.</p>');
		
		
		return this;
	},

});


var DigestImage = Backbone.View.extend({
	
	className: 'digest-content-img',

	events: {
		'click' : 'navigate',
	},

	render: function() {

		this.el.style.backgroundImage = 'url('+ this.model.get('digestData').objectImg +')';

		if(this.model.get('column_type') === 'people'){

			var faces = new Faces({ model: this.model });

			this.$el.append( faces.render().el );

		}
		
		return this;
	},

	navigate: function(){
	
		this.model.imageClick();	
	},

});

var DigestIcon = Backbone.View.extend({
	
	className: 'digest-icon',

	tagName: 'img',

	render: function() {

		this.el.src = this.options.src;
		
		return this;
	},

});

var DigestTitle = Backbone.View.extend({
	tagName: 'h1',

	render: function() {

		var headline = "";

		if( this.model.get('typeTitle') === 'Friends' ){

			headline = "<span> Check out other fans of</span>";

		}

		this.$el
			.append( this.model.get('typeTitle') )
			.append( headline );	
		
		return this;
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

var ObjectTitle = Backbone.View.extend({
	
	className: 'digest-object-title bold',

	tagName: 'h2',

	render: function() {

		var title = this.model.get('digestData').objectTitle,
			artist = this.model.get('digestData').artist;

		if( this.model.get('column_type') === "clip" ) {

			this.el.className += " red uppercase";

		}

		this.$el
			.append( artist || title )
			.append( artist ? "<span> - "+ title +"</span>": "");
		
		return this;
	},

});
var Links = Backbone.Collection.extend({
	model: LinkModel,

});

var Faces = Backbone.View.extend({
	className: 'tastemates',

	render: function() {

		_.each(this.model.get('digestData').facebookIDs, this.tasteMate, this);
		
		return this;
	},

	tasteMate: function(mate){


		var avatar = new Avatar({ src: mate });

		this.$el.append( avatar.render().el );	
		 
	
	},

});


var PurchaseLinks = Backbone.View.extend({
	className: 'purchase-links',

	initialize: function(links){

		this.collection = new Links(links);
	
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







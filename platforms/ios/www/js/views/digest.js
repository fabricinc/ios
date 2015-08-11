var DigestModel = Backbone.Model.extend({

	defaults: {
		playing: false,
	},

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
		this.set('icon', 'images/discovery/categoryIcons/' + icon.toLowerCase() + '.png');
		
		switch(this.get('typeTitle')){
			case 'Music':
				this.set('track', this.createMedia(this.get('digestData').clip));
				break;
			case 'Movie': 
				this.set('track', this.createMedia(this.get('digestData').clip));
		}

	},

	createMedia: function(clip){

		if(!clip) { return null; }

		var mediaType = this.get('typeTitle') === "Music" ? "AUDIO" : "VIDEO";
		var media = document.createElement(mediaType);

		media.preload = "auto";
		media.src = clip;

		media.addEventListener('pause', function(e) { this.togglePlaying(); }.bind(this));
		media.addEventListener('play', function(e) { this.togglePlaying(); }.bind(this));

		if(mediaType === "VIDEO"){
			media.addEventListener('ended', function(e) { this.exitFullScreen(); }.bind(this));
		}

		return media;
	
	},
	togglePlaying: function(e){
	
		this.set('playing', !this.get('playing'));
	
	},

	exitFullScreen: function(){
	
		this.get('track').webkitExitFullScreen();
	
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
		console.log( this.get('column_type') );
		switch(this.get('column_type')){

			case 'people':
				Backbone.history.navigate("matches", true);
				break;
			case 'pack':
				Backbone.history.navigate("discovery?categoryID=" +  this.get('digestData').categoryID + "&listID=null", true);
				break;
			case 'clip':
				if(!this.get('track')) {  // If there is no track route them to the lobby
					this.goToLobby();
				}
				this.playPause();

		}
	
	},

	goToLobby: function(){

		Backbone.history.navigate('movieLobby/null/'+ this.get('object_id'), true);

	},

	playPause: function(){
	
		this.collection.handlePlayback( this );	 
	
	},

});


var DigestItems = Backbone.Collection.extend({

	model: DigestModel,

	playing: false,

	tack: null,

	handlePlayback: function( currentModel ){
		
		var track = currentModel.get('track');


		if(!track) { return; }

		
		if(this.playing){

			if (this.track === track) {

				// pause track
				this.pause();

				// Set play status on collection
				this.updatePlayStatus();

			} else { 		// Set new track

				// Set current model id
				this.currentModelID = currentModel.cid;

				// Pause old track
				this.pause();

				this.updatePlayStatus();

				// Switch to new track
				this.setTrack( track );

				// Play new track
				this.play();

			}
			
			
		} else { 	//Not playing any tracks

			// Set current model id
			this.currentModelID = currentModel.cid;

			this.setTrack( track );

			this.play();

			this.updatePlayStatus();
		}

	},

	setTrack: function(newTrack){
	
		this.track = newTrack;

		// When the track ends change playstatus 
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

		 this.playing = !this.playing;

		 // Update the playing status on 
		 // the model of the current track 
		 // Pass playStatus after it has been updated

		 // this.updateModelPlayStatus( this.playing );
	
	},

	updateModelPlayStatus: function( playStatus ){

		var trackModel = this.get(this.currentModelID);

		trackModel.set('playing', playStatus);

	
	},

});

var DigestSectionModel = Backbone.Model.extend({

	defaults: {
		firstName: null,
		day: null,
	},
	
	initialize: function() {

		this.set('firstName', APP.gameState.uName.split(" ")[0]);
		this.set('day', this.getDay());

		
		
	},

	getDay: function(){
	
		var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
		var date = new Date();

		return days[date.getDay()];
	
	},

});

var DigestSection = Backbone.View.extend({

	el: "#content-container .content-scroller",

	initialize: function(items){
		
		this.collection = new DigestItems(items.digestData); 
		this.model = new DigestSectionModel(items.heading);
	
	},

	render: function(){

		// empty out the div
		this.$el
			.empty()
			.removeClass('loading');

		// Create background red color at top of screen 
		var backgroundRed = new BackgroundRed();
	
		// Create Header
		var header = new DigestHeader({ model: this.model });

		this.$el
			.append( header.render().el )
			.prepend( backgroundRed.render().el );

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

var BackgroundRed = Backbone.View.extend({

	id: "background-red",

	render: function() {

		return this;

	},

});

var DigestHeader = Backbone.View.extend({
	
	id: 'digest-header',

	render: function(){
	
		// Day of the week
		this.$el
			.append( "<h1 id='digest-day'>It's "+ this.model.get("day") )
			.append( "<p id='digest-line'>Hi " + this.model.get("firstName") + ", here are your daily picks powered by</p>" )
			.append( "<p id='digest-facts'><span class='bold'>"+ this.model.get('interests') +" Interests</span> and <span class='bold'> "+ this.model.get('tastemates') +" Tastemates</span></p>" );
		

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
			.append( objectTitle.render().el );
		
		
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

		if (this.model.get('track')) {

			var playButton = new PlayButton({ model: this.model });

			this.$el.append( playButton.render().el );

		}

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

	events: {
		"click": "routeLobby"
	},

	initialize: function(){
	
		if( this.model.get('column_type') === "clip" ) {

			this.el.className += " red uppercase";

		}
	
	},

	render: function() {

		var title = this.model.get('digestData').objectTitle,
			artist = this.model.get('digestData').artist;


		this.$el
			.append( artist || title )
			.append( artist ? "<span> - "+ title +"</span>": "");
		
		return this;
	},

	routeLobby: function(){
	
		this.model.goToLobby();

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

var PlayButton = Backbone.View.extend({
	className: 'play-button',

	events: {
		// 'click': 'playPause',
	},

	initialize: function(){
	
		this.listenTo(this.model, 'change:playing', this.playPauseButton);
	
	},

	render: function() {

		// this.$el.append(  );

		return this;
	},

	playPause: function(){
	
		this.model.playPause();
	
	},

	playPauseButton: function(){
	
		this.$el.toggleClass('pause');
	
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







var ShareModel = Backbone.Model.extend({

	defaults: {
		name: null,
		text: null,
	},

	share: function(){
		
		var name = this.get('name');
		var shareType = this.shareTypes[name];

		console.log( shareType );

		if(shareType) {

			window.plugins.socialsharing.shareVia(
				shareType,
				"Check out this app Fabric. We can recommend movies/TV/music to each other: http://bit.ly/fabricapp",
				"Check out Fabric",
				null,
				"http://bit.ly/fabricapp"
			);

		} else {

			Backbone.history.navigate('friends/null/true', true);

		}
	
	},

	shareTypes: {
		"facebook": "Facebook",
		"twitter": "Twitter",
		"email": "Email",
		"text": "SMS"
	},
	

});
var ShareCollection = Backbone.Collection.extend({

	model: ShareModel

});

var Invite = Backbone.View.extend({
	el: "#wrapper",
	

	render: function(callback) {

		var shareButtons = new ShareButtons();
		var back = new BButton();

		this.$el.html( '<div id="invite"></div>' );

		this.$("#invite")
			.html( back.el )
			.append('<h3>Now invite your tastemates</h3><h4>We know you have friends with good taste like you. Why not invite them and discover togeather</h4>')
			.append( shareButtons.el );

		callback();
	},
	dealloc: function(){
	
		
	
	},

});

var BButton = Backbone.View.extend({
	
	className: 'carrot',

	id: 'invite-back',

	events: {
		'click': 'back'
	},

	initialize: function(){
	
		this.render();
	
	},
	
	render: function() {


		return this;
	},

	back: function(){

		window.vent.trigger('back');
	
	},
});

var ShareButtons = Backbone.View.extend({

	id: 'share-buttons',
	
	initialize: function(){
		var shares = [
			{ name: "text", "text": "Invite via" }, 
			{ name: "email", "text": "Invite via" }, 
			{ name: "twitter", "text": "" }, 
			{ name: "facebook", "text": "" }, 
			{ name: "fabric", "text": "Find friends on" }
		];

		this.collection = new ShareCollection(shares);

		this.render();
	
	},

	render: function() {

		this.collection.each(this.addOne, this);

		return this;
	},

	addOne: function(button){
	
		var shareButton = new ShareButton({ model: button });
		this.$el.append( shareButton.render().el );
	
	}

});

var ShareButton = Backbone.View.extend({

	events: {
		'click': 'share'
	},

	initialize: function(){
		
		var name = this.model.get('name');

		this.$el		
			.addClass(name)
			.css({'backgroundImage' : 'url(images/invite/'+ name +'.jpg)'});

	
	},
	
	render: function() {
		var _m = this.model.toJSON();

		this.$el.append( _m.text +" "+ _m.name );

		return this;
	},

	share: function(){
	
		this.model.share();
	
	},

});
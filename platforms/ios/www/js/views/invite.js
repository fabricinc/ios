var ShareModel = Backbone.Model.extend({

	defaults: {
		name: null
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


		this.$el
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
	
		Backbone.history.navigate('back', true);
	
	},
});

var ShareButtons = Backbone.View.extend({

	id: 'share-buttons',
	
	initialize: function(){
		var shares = [
			{ name: "text" }, 
			{ name: "email" }, 
			{ name: "twitter" }, 
			{ name: "facebook" }, 
			{ name: "fabric" }
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
	className: 'share-button',
	
	render: function() {

		this.$el.append( this.model.toJSON().name );

		return this;
	},

});
var WantToModel = Backbone.Model.extend({

	defaults: {	
		checked: false
	},

	// Turn off sync to stop 'url' error
	sync: function () { return false; },


	toggle: function() {
		var publishedID = this.get('moviePublishedID'),
			check = this.get('checked');

		// remove from list
		Api.setMovieToFabricList(publishedID, APP.gameState.watchListID, check);

		this.save({ checked : !check });

	}, 
	lobby: function () {
		Backbone.history.navigate('movieLobby/'+ this.get('movieID'), true);
	}


});


var WantToList = Backbone.Collection.extend({
	model: WantToModel
});


var WantToListView = Backbone.View.extend({

	el: "#content-container .content-scroller",

	initialize: function(Q) {

		this.collection = new WantToList(Q);

	},

	render: function() {

		var list = this.collection.toJSON()[0];


		//Empty the content container for a fresh start
		this.$el.empty();

		this.$el
			.removeClass('loading');

		// If the Q isn't loaded show the loading screen
		if (list.emptyList) {

			this.$el.html(
				'<p class="blank-message">Nothing here yet!</p><p class="blank-instructions">Tap the explore tab and check out some packs to start building your want-to list</p>'
			);
			

			return this;
		}


		// put the list on the page (LIMITED TO 50)
		_.each(this.collection.slice(0,49), this.addOne, this);



		return this;
	},

	addMore: function() {
		var start = this.$('.check-list-wrapper').length,
			end = start + 50;


		_.each(this.collection.slice(start, end), this.addOne, this);
		
	},

	addOne: function(wantToItem) {

		var wantTo = new WantTo({ model: wantToItem });

		this.$el.append(wantTo.render().el);

	}
});


var WantTo = Backbone.View.extend({
	
	className: 'check-list-wrapper',


	events: {
		'click .check-list-check' : 'checkBox',
		'click .check-list-poster': 'lobby'
	},


	initialize: function() {

		this.listenTo(this.model, 'change:checked', this.toggleCheck);
		
	},


	render: function () {
		var itemData = this.model.toJSON();

		var html = APP.load('wantToItem', itemData);

		this.$el.html( html );

		if(itemData.checked){ this.el.className += ' checked'; }


		return this;

	},


	checkBox: function () {

		this.model.toggle();
	},

	toggleCheck: function() {

		this.$el.toggleClass('checked');
	},

	lobby: function() {
		this.model.lobby();
	}
});






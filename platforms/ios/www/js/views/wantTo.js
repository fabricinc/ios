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

		// Set filter on APP
		APP.wantToSortFilter = this.collection.sortOrder;

		// Go to the lobby
		Backbone.history.navigate('movieLobby/'+ this.get('movieID'), true);

	}


});


var WantToList = Backbone.Collection.extend({
	
	sortOrder: 'Count',

	model: WantToModel,

	initialize: function () {

		this.sortOrder = APP.wantToSortFilter || 'Count';

	},
	
	comparator: function (wantTo) {

		return - wantTo.get(this.sortOrder);
		
	}


});

var SortModel = Backbone.Model.extend({
	defaults: {
		sortOrder: 'Count'
	}
});

var SortView = Backbone.View.extend({
	id: "#want-to-sort",

	events: {
		'click' : 'filter'
	},

	render: function() {

		this.$el.html("<p>sort</p>");
		
		return this;
	},


	filter: function() {
		this.collection.sortOrder = 'criticsScore';

		this.collection.sort();

	}

});


var WantToListView = Backbone.View.extend({

	el: "#content-container .content-scroller",

	initialize: function(Q) {

		this.collection = new WantToList(Q);

		this.listenTo(this.collection, 'sort', this.sortList);

	},

	render: function() {

		var list = this.collection.toJSON()[0];
		this.sort = new SortView({ collection: this.collection });


		//Empty the content container for a fresh start and remove the laoding sequence 
		this.$el
			.empty()
			.removeClass('loading');
			

		// If the Q isn't loaded show the loading screen
		if (list.emptyList) {

			this.$el.html(
				'<p class="blank-message">Nothing here yet!</p><p class="blank-instructions">Tap the explore tab and check out some packs to start building your want-to list</p>'
			);
			

			return this;
		}

		// Add Sort filter view
		this.$el.prepend(this.sort.render().el);


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

	},

	// Function to handle rerendering of list after sort
	sortList: function () {

		this.render();
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






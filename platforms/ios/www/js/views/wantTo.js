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
		selected: false
	},

	sync: function () { return false; }
});

var SortFilters = Backbone.Collection.extend({
	model: SortModel
});

var SortController = Backbone.View.extend({
	el: '#category-container',

	events: {
		"click" : 'toggleSortView'
	},

	initialize: function (options) {
		
		this.vent = options.vent;

		this.sort = new SortView({ vent: this.vent });

	},


	render: function () {
		this.$el.prepend( "<h1 id='want-to-sort'>Sort <span>Filter</span></h1>" );

		return this;
	},

	toggleSortView: function () {

		this.vent.trigger( 'toggleSortView' );
		this.$el.append( this.sort.render().el );
	}
});

// collection view for filters and sort
var SortView = Backbone.View.extend({

	id: "want-to-filters",

	tagName: "ul",

	events: {
		'click' : 'filter'
	},

	initialize: function (options) {

		this.collection = new SortFilters([
			{
				name: 'Count',
				filter: 'Count',
			},{
				name: 'critics Score',
				filter: 'criticsScore',
			},{
				name: 'Popular with Everyone',
				filter: 'totalCount',
			},{
				name: 'Recently Added',
				filter: 'modified',
			}
		]);

		this.vent = options.vent;

		// this.vent.on('toggleSortView', this.showHide, this);

	},

	render: function() {


		this.collection.each( this.addFilter, this );
		
		return this;
	},


	filter: function() {
		// this.collection.sortOrder = 'criticsScore';

		// this.collection.sort();

		this.vent.trigger( 'hello' );

	},

	addFilter: function(filter) {
		
		var filter = new FilterView({ model: filter });

		this.$el.append( filter.render().el );
	},

	showHide: function () {
		console.log('showHide');
		
	}

});

var FilterView = Backbone.View.extend({

	className: "want-to-filter",

	tagName: 'li',

	initialize: function () {
		
	},

	render: function () {
		var filter = this.model.toJSON();

		var html = APP.load( 'wantToSort', filter );

		this.$el.html( html );


		return this;
	}
});

// collection view for want-to items
var WantToListView = Backbone.View.extend({

	el: "#content-container .content-scroller",

	initialize: function(Q) {

		this.collection = new WantToList(Q);

		// Set up a little pub/sub
		this.vent = _.extend({}, Backbone.Events);

		// this.sortController = new SortController({ vent: this.vent })
		// this.sort = new SortView({ vent: this.vent });

		this.vent.on('hello', function () {
			console.log('ehllo');
		});

		this.vent.on('toggleSortView', this.toggleSortView);
		this.listenTo(this.collection, 'sort', this.sortList);

	},

	render: function() {

		var list = this.collection.toJSON()[0];


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

		// this.sort.render();
		// this.sortController.render();



		// console.log(this.collection);

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

		this.$el.append( wantTo.render().el );

	},

	// Function to handle rerendering of list after sort
	sortList: function () {

		this.render();
	},

	toggleSortView: function () {
		console.log('toggleSortView');
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






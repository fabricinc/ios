
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

		var sortValue = wantTo.get(this.sortOrder),
			sO = this.sortOrder;

		// if value is a flasey return -1
		if(!sortValue) { return -1; }

		if(sO === 'movieTitle'){

			return sortValue;

		} else if(sO === 'releaseDate' || sO === 'modified') {
			
			// validate date
			var date = Util.defined( sortValue ) && sortValue !== "0000-00-00" ? sortValue.slice(0,10) : "1920-02-03";

			return - new Date( date );

		} else {

			return - parseInt( sortValue );

		}

	},

	sortColletion: function (filter) {

		if(filter == this.sortOrder) { return; }

		APP.wantToSortFilter = filter.filter;

		this.sortOrder = filter.filter;
		this.sort();

	}


});


var SortControllerModel = Backbone.Model.extend({

	// Turn off sync to stop 'url' error
	sync: function () { return false; },

	defaults: {
		show: false,
		filter: 'Count'
	},


	toggleSort: function() {
		var show = this.get("show") ? "hide" : "show";

		this.trigger(show);
		this.save({ show: !this.get("show") });

	},
	setFilter: function(filter){

		this.set('filter', filter);

	}
});

var SortController = Backbone.View.extend({
	el: '#category-container',

	events: {
		"click #want-to-sort" : 'toggleSortView'
	},
	formatFilter: {
		totalCount: 'Popularity with Everyone',
		Count: 'Popularity with Friends',
		criticsScore: 'Critics Score',
		releaseDate: 'Release Date',
		modified: 'When Added',
		movieTitle: 'A to Z',
	},

	initialize: function (options) {
		
		this.vent = options.vent;
		
		this.model = new SortControllerModel({ filter: this.formatFilter[options.filter] });
		this.sort = new SortView({ vent: this.vent });



		this.listenTo(this.model, 'change:filter', this.updateFilter, this);

		this.vent.on('filter', this.setFilter, this);

	},


	render: function () {

		this.$el.prepend( "<div id='want-to-sort'>Sort <span id='active-filter'>"+ this.model.get("filter") +"</span></div>" )
				.prepend( this.sort.render().el );

		return this;

	},

	toggleSortView: function () {
	
		this.vent.trigger( 'toggleSortView' );

		this.model.toggleSort();

	},

	setFilter: function (filter) {

		this.model.setFilter(filter.name);

	},

	updateFilter: function (filter) {

		this.$("#active-filter").text(filter.get('filter'));

	}
});


var SortModel = Backbone.Model.extend({
	sync: function () { return false; },
	
	defaults: {
		selected: false
	},

	toggleCheck: function() {

		this.save({ selected: !this.get('selected') });

	}

});

var SortFilters = Backbone.Collection.extend({
	model: SortModel,
	
});



// consoleollection view for filters and sort
var SortView = Backbone.View.extend({

	id: "want-to-filters",

	tagName: "ul",

	initialize: function (options) {

		this.collection = new SortFilters([
			{
				name: 'Popularity with Friends',
				filter: 'Count',
			},{
				name: 'Popularity with Everyone',
				filter: 'totalCount', 
			},{
				name: 'Critics Score',
				filter: 'criticsScore',
			},{
				name: 'A to Z',
				filter: 'movieTitle',
			},{
				name: 'Release Date',
				filter: 'releaseDate',
			},{
				name: 'When Added',
				filter: 'modified',
			}
		]);

		this.vent = options.vent;

		// Show and hide the filter view on toggle event and filter
		this.vent.on('toggleSortView filter', this.showHide, this);

	},

	render: function() {

		this.collection.each( this.addFilter, this );
		
		return this;

	},


	addFilter: function(filter) {
		
		var filterView = new FilterView({ model: filter, vent: this.vent });

		this.$el.append( filterView.render().el );

	}, 

	showHide: function () {
		var height = this.$el.height() ? 0 : 246;

		this.$el.height(height);

		$("#screen").toggleClass('show');

	}

});

var FilterView = Backbone.View.extend({

	className: "want-to-filter",

	tagName: 'li',

	events: {
		'click' : 'filter'
	},

	initialize: function (options) {

		this.vent = options.vent;
		this.listenTo(this.model, 'change:selected', this.check, this);

	},

	render: function () {

		var filter = this.model.toJSON();

		var html = APP.load( 'wantToSort', filter );

		this.$el.html( html );


		if(APP.wantToSortFilter === filter.filter){
			this.$el.addClass('selected');
		}


		return this;
	},

	filter: function () {
		this.vent.trigger();
		this.model.toggleCheck();

	},

	check: function () {

		$(".selected").removeClass('selected');

		this.$el.addClass('selected');


		this.vent.trigger('filter', { filter: this.model.get('filter'), name: this.model.get('name') });

	}
});



// collection view for want-to items
var WantToListView = Backbone.View.extend({

	el: "#content-container .content-scroller",

	initialize: function(Q) {

		this.collection = new WantToList(Q);


		// Set up a little pub/sub
		this.vent = _.extend({}, Backbone.Events);

		this.sortController = new SortController({ vent: this.vent, filter: this.collection.sortOrder });


		this.listenTo(this.collection, 'sort', this.sortList);
		this.vent.on('filter', this.triggerSort, this);

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


		// Only render sort if not on page
		if(!$("#want-to-sort").length){

			this.sortController.render();

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

		this.$el.append( wantTo.render().el );

	},

	// Function to handle rerendering of list after sort
	sortList: function () {

		this.render();

	},

	triggerSort: function (filter) {

		this.collection.sortColletion(filter);
		UI.scroller.refresh();
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






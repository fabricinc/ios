var SearchMethod = Backbone.Model.extend({

	defaults: {
		'results': undefined
	},
	
	initialize: function() {

		
		
	},

	performSearch: function(searchValue){
	
		if(searchValue.length < 2) { 
			this.clear(); 
			return; 
		}


		Api.findMoviesLikeTitle(searchValue, 1, function(response) {

			if(response.data.length > 0) {

				// UI.scroller.disable();

				this.set('results', new Results(response.data));
				
			}
		
		}.bind(this));
	
	},

	clear: function(){
		
		if( !this.get('results') ){ return; }

		// UI.scroller.enable();

		var results = this.get('results');

		results.$el
			.removeClass('active')
			.empty();


		this.set('results', undefined);
	
	},

});


var Search = Backbone.View.extend({
	
	el: '.user-favorite-interest',

	events: {
		'input input' : 'performSearch',
		'touchstart #close': 'clear',
	},
	
	initialize: function(){

		this.model = new SearchMethod();
	
	},

	render: function() {

		// var template = APP.load('newSearch');

		// this.$el.append( template );


		return this;
	},

	performSearch: function(e){

		this.$('#close').addClass('active');
		this.model.performSearch(e.target.value); 
	
	},

	clear: function(){

		this.$('#close').removeClass('active');
		this.$('input').val('');
		this.model.clear();
	
	},

});

var SearchResult = Backbone.Model.extend({

	defaults: {
		
	},
	
	initialize: function() {

		
		
	},

	lobby: function(){
		
		// Backbone.history.navigate('movieLobby/'+ this.get('movieID'), true);
	
	},

});

var SearchResults = Backbone.Collection.extend({

	model: SearchResult,

});


var Results = Backbone.View.extend({

	el: '#search-results',
	

	initialize: function(data){
		
		this.collection = new SearchResults(data);

		this.$el.addClass('active');

		this.$el.empty();

		this.render();

	},
	
	render: function() {

		this.collection.each(this.addOne, this);

		$(".welcome-container").scrollTop(230);

		return this;
	},

	addOne: function(resultModel){
	
		var result = new Result({ model: resultModel });

		this.$el.append( result.render().el );
	
	},

});

var Result = Backbone.View.extend({

	className: 'result',
	
	tagName: 'div',


	render: function() {

	
		this.$el.append( APP.load('result', { result: this.model.toJSON() }) );


		this.$el.fastClick(function () {
			
			this.lobby();
		
		}.bind(this));

		return this;
	},

	lobby: function(){
		

		window.vent.trigger('setID', this.model.get('moviePublishedID'));
	
	},
});
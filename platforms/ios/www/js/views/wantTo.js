var WantToModel = Backbone.Model.extend({
	

	defaults: {		
		checked: false
	},


	initialize: function () {
		
		console.log(this);

	}


});


var WantToList = Backbone.Collection.extend({
	model: WantToModel

});



var WantToListView = Backbone.View.extend({

	el: "#content-container .content-scroller",

	initialize: function(Q) {

		this.collection = new WantToList(Q);


		this.render();
	},

	render: function() {

		//Empty the content container to keep it clean
		this.$el.empty();

		// Distory Scroller so we can reinit 
		UI.scroller.destroy();


		// put the list on the page 
		this.collection.each(this.addOne, this);


		// Reinit the scroller 
		UI.initScroller($("#category-container")[0]);



		return this;
	},

	addOne: function(wantToItem) {

		var wantTo = new WantTo({ model: wantToItem });

		this.$el.append(wantTo.render().el);

	}
});

var WantTo = Backbone.View.extend({
	
	className: 'check-list-wrapper',

	events: {
		'touchStart .check-list-check' : 'checkBox',
	},


	render: function () {


		var html = APP.load('wantToItem', this.model.toJSON());

		this.$el.html(html);

		return this;

	},


	checkBox: function () {
		console.log(this.model.moviePublishedID);
		console.log(this.checked);
	}
});






var WantToModel = Backbone.Model.extend({
	

	defaults: {		
		checked: false
	},


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

		this.$el.html("");

		this.collection.each(function (wantToItem) {

			var wantTo = new WantTo({ model: wantToItem });

			this.$el.append(wantTo.render().el);

			console.log(wantTo);
		}, this);

		return this;
	}
});

var WantTo = Backbone.View.extend({
	
	className: 'check-list-wrapper',

	tagName: 'div',

	initialize: function () {

		// body...
	},

	render: function () {

		console.log(this.model.toJSON());

		var html = APP.load('wantToItem', this.model.toJSON());

		this.$el.html(html);

		return this;

	}
});






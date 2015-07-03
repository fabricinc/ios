var OtherUserListModel = Backbone.Model.extent({
	initialize: function(options) {

		
		console.log(options);

	}
});




var OtherUserListView = Backbone.View.extent({

	initialize: function (options) {
		console.log(options);

		this.mdoel = new OtherUserListModel(options);
	},


	render: function (callback) {
		

		console.log('render');
	}

});
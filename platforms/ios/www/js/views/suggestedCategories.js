	var SuggestedCategoriesModel = Backbone.Model.extend({
		categoryID: null,
		nextCats: null,

		initialize: function() {

    	},
    	fetch: function(categoryID, callback) {
    		var self = this; 
			Api.getNextCategories(categoryID, function(response){ 
				if(response.success){
					callback(response.data);
				}
			});
    	},
	    bindEvents: function() {

	    }
    });

    var SuggestedCategoriesView = Backbone.View.extend({
		model: null,
		id: "suggestedCategories",
		categoryID: null,
		
        initialize: function() {
			var self = this;

			self.model = new SuggestedCategoriesModel();
			this.render();
			return this;
        },

        render: function(callback) {
        	callback = callback || function() {};
			var self = this;

			self.model.fetch(self.categoryID, function(categories) {
				var html = APP.load("upNext"),
					nextCats = APP.load("categoryFeed", { items: categories });

				self.$el.html(html);
				$("#up-next-wrapper").prepend(nextCats);
				callback();
				return this;
				
			});
			
        },

        dealloc: function() {
        }
    });
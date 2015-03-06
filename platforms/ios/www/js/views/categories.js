var CategoriesModel = Backbone.Model.extend({
		start: 0,
		view: null,
		categoryID: null,
		categoryTitle: null,
		
		initialize: function(view) {
			this.start = 0;
			this.view = view;
		},
		getCategories: function(categoryID, callback) {
			var self = this;
			self.view = self.view || "allCategories";
			self.categoryID = categoryID || null;
			
			if(self.view == "allCategories") {
				self.allCategories(callback, false);
			}
		},
	    allCategories: function(callback, skipSelectMovie) {
	        var self = this;
	        self.start = 0;
	        var options = { "action": "getCategories" };
	
			if(self.categoryID) {
				options.categoryID = self.categoryID;
			}
				
	        Api.dispatcher(options, function(categories) {
				self.categoryTitle = categories.title[0].categoryName || "All Categories";
	            if (categories.length === 0) {
					Util.log("no categories found - error!");
					callback(null);
	                //APP.WelcomeController.loadWelcomeMessage();
					// go to home page?
	            } else {
					callback(categories.list);
	            }
				
	        });
	    },
		bindEvents: function() {
			/*
			$(".user-lists .list-view").html(buttonText).fastClick(function() {
	            if (self.click) return;
	            Sounds.standardButton();
	            if (skipSelectMovie) {
	                APP.dispatcher("player", {listID: $(this).attr("listid")});
	            } else {
	                APP.dispatcher('selectMovie', $(this).attr("rel"), null, $(this).attr("listid"));  // categoryID, movieID, listID
	            }
	        });
			*/

			/*
	        $(".parent .list-view").fastClick(function() {
	            if (self.click) return;
	            Sounds.standardButton();
	            APP.dispatcher('allCategories', $(this).attr("rel"), $(this).attr("name"));
	        });
			*/
			
	        // Multi-line ellipsis for iPhone
	        if (Util.isPhone()) {
	            $(".list-name .text .name").dotdotdot({
	                ellipsis: "...",
	                remove: [ ' ', ',', ';', '.', '!', '?' ]
	            });
	        }

	        UI.initScroller($("#list-row").parent()[0]);
		}
    });

    var CategoriesView = Backbone.View.extend({
		model: null,
		categoryID: null,
		
        initialize: function(options, callback) {
            callback = callback || function() {};
			options = options || {};

			this.categoryID = options.categoryID || null;
			this.model = new CategoriesModel(options.view);

            return this;
        },
        render: function(callback) {
			var self = this;
			var title;
			
			callback = callback || function() {};
			
			APP.models.categories = self.model;
			
			if(self.categoryID) {
				title = "";
			} else {
				
			}
			
			self.model.getCategories(self.categoryID, function(categories) {
				if(!categories) { return false; }
				
				$.get('templates/categories.html', function(html) {
					var html = _.template(html, { items: categories });
		            self.$el.html(html);
		            if (!self.header) {
		                self.header = new HeaderView({
		                    title: self.model.categoryTitle,
		                });
		                self.$el.prepend(self.header.el);
		            }

					$("#wrapper").html(self.$el.html());
					callback();

					UI.bindMovieRowEvents();
                    UI.initScroller();
				});
			});
        },
        dealloc: function() {
	
		}
    });
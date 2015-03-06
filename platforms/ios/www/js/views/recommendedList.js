var RecommendedListModel = Backbone.Model.extend({
		view: null,
        list: null,
        offset: 0,
        limit: 50,
        sublist: false,
        proLoadFinished: false,

		initialize: function(options) {
            this.sublist = options.submenu;
        },
        fetchData: function(callback) {
            var self = this;

            if(parseInt(self.sublist)) {
                Api.getRecSubList(self.sublist, function(response) {
                    if(response.success) {
                        self.proLoadFinished = true;
                        callback(response.data);
                    }
                });
            } else {
                Api.getRecommendedLists(function(response) {
                    if(response.success) {
                        if(response.data.length < self.limit) {
                            self.proLoadFinished = true;
                        }
                        self.offset += response.data.length;
                        callback(response.data);
                    }
                }, self.offset, self.limit);
            }
        }
	});
	
	var RecommendedListView = Backbone.View.extend({
        id: "recommended-list",
		model: null,
		header: null,

        initialize: function(options, callback){
            options = options || null;
            callback = callback || function() {};

            this.model = new RecommendedListModel(options);

            return this;
        },
        render: function(callback){
			var self = this;
            callback = callback || function() {};
            
            self.model.fetchData(function(list){
                var html = APP.load("recommendedList", { items: list }),
                    recFeedPos = APP.recFeedPos < 0 && APP.recFeedPos ? APP.recFeedPos : 0;

                self.$el.html(html);

                if (!self.header) {
                    self.header = new HeaderView({
                        leftButton: { class: self.model.sublist != "false" ? "back" : "slide" },
                        title: "Recommended"
                    });
                    self.$el.prepend(self.header.el);
                }

                $("#wrapper").html(self.$el);
                if(APP.recFilter){ APP.recFilter = null; }

                UI.initScrollerOpts($("#rec-list-wrapper")[0], { 
                    vScrollbar: false,
                    hScroll: false,
                    bounce: true,
                    click: true,
                    startY: recFeedPos
                });

                self.bindEvents();

                setTimeout(function(){ UI.scroller.refresh(); }, 500);
                 
                setTimeout(function() {
                    UI.scroller.on("scrollEnd", function() {
                        if(!self.model.proLoadFinished) {
                            if(Math.abs(this.maxScrollY) - Math.abs(this.y) < 800) {
                                self.updateList();
                            }
                        }
                    });
                }, 500);

                APP.recFeedPos = 0;

                callback();
            });

        },
        updateList: function() {
            // this view function grabs the next subset of recommendations to load in the list
            var self = this;
            self.model.fetchData(function(list) {
                var html = APP.load("recommendedListPart", { items: list });
                $("#rec-scroller").append(html);
                UI.scroller.refresh();
                self.bindEvents();
            });
        },
        bindEvents: function() {
            $(".list-item").unbind("click").click(function(e) {
                e.preventDefault();
                e.stopPropagation();

                APP.recFeedPos = UI.scroller.y;
                var listID = $(this).data("listid"),
                    parent = $(this).data("parent");

                if(parseInt(parent)){
                    Backbone.history.navigate("recommendedList/"+ listID, true);
                } else {
                    Backbone.history.navigate("userRecommendations/"+ listID, true);
                }

                return false;
            });
        },
        dealloc: function() {}
    });
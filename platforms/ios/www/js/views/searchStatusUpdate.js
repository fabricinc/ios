var SearchStatusUpdateModel = Backbone.Model.extend({

    defaults: function() {

        return {

        }

    },



    initialize: function() {



    },



});


// Create Recommended People section 
var SearchStatusUpdateView = Backbone.View.extend({
    id: "search-view",
    model: null,
    el: "#wrapper",



    initialize: function() {
        this.model = new SearchStatusUpdateModel();


    },

    // Bind events for swipeing the cards left and right
    events: {
        
    },


    bind: function() {

        var sUpdate = $("#status-update-input");


        sUpdate.on("input", function(e) {
            var title = $(this).val();
            $("#close-status-drop").show();


            if(title.length > 2) {
                Api.findMoviesLikeTitle($(this).val(), function(response) {


                    if(response.data.length > 0) {


                        var html = APP.load("feedSearchResults", { data: response.data });


                        $("#search-results").html(html);
                        $("#search-results").addClass("on");


                        $("#search-results .result").unbind("click").click(function() {
                            var movieID = $(this).data("movieid");
                            Backbone.history.navigate("statusUpdate/" + movieID, true);
                        });
                        

                        UI.scroller.refresh();
                        
                        setTimeout(function() {
                            // IN IOS 8 BLUR COLLAPSED DROP DOWN
                            UI.scroller.on('scrollStart', function () {
                                 sUpdate.blur();
                            });
                        }, 500);


                    } 
                });
            } else {
                $("#search-results").html("");
                $("#search-results").removeClass("on");
            }
        });

        $(document).on("keydown", function(e) {
            if(e.keyCode == 13) { sUpdate.blur(); }
        });

        $("#close-status-drop").fastClick(function(e) {
            e.preventDefault();
            e.stopPropagation();

            sUpdate.val("");
            $("#close-status-drop").hide();
            $("#status-drop div").html("");
            $("#status-drop").removeClass("on");

            UI.deallocScroller();
            UI.initScroller($("#category-container")[0]);

            return false;
        });
    },


    render: function(callback) {
        callback = callback || function() {};
        var template = APP.load('searchStatusUpdate');


        var header = new HeaderView({
            title: "Pick Topic",
            home: false,
        });


        this.$el
            .html(header.el)
            .append(template);


        UI.initScroller($("#search-wrapper")[0]);  


        this.bind();


        callback();
        return this;
    },
    dealloc: function() {

    }


});




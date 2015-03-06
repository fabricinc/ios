var FabricPlayerModel = Backbone.Model.extend({
    movies: [],
    currentPos: 0,
    listID: null,
    recommendation: false,

    initialize: function(opts) {
        this.listID = opts.listID || null;
        this.recommendation = opts.recommendation || false;
    },

    init: function(callback) {
        var self = this;
        Api.getListMovies(self.listID, this.recommendation, function (response) {
            if(response.success) {
                self.movies = response.data;
            }
            callback(self.movies);
        });
    }
});

var FabricPlayerView = Backbone.View.extend({
    model: null,

    // new
    initialize: function(options, callback) {
        callback = callback || function() {};

        this.model = new FabricPlayerModel(options);
        APP.models.FabricPlayer = this.model;

        return this;
    },

    render: function(callback) {
        var self = this;
        callback = callback || function() {};

        this.model.init(function(movies) {
            if(movies.length <= 0) {
                Util.log("nothing");
            }
            self.$el.html(APP.load("fabricPlayer", { movies: movies }));
            self.header = new HeaderView({
                title: "Fabric Player"
            });
            self.$el.prepend(self.header.el);
            $("#wrapper").html(self.$el.html());

            self.bindEvents();

            callback();
        });
    },

    bindEvents: function() {
        var self = this;
        var video = document.getElementsByTagName('video')[0];

        $(".movie-poster").click(function() {
            var pos = $(this).data("pos");
            if(parseInt(pos) != parseInt(self.model.currentPos)) {
                self.loadVideo(pos);
            } else {
                video.play();
            }
        });

        self.addPlayerListeners(video);
        UI.initScroller($("#movie-list")[0]);
    },

    addPlayerListeners: function(video) {
        var self = this;
        video.addEventListener('waiting', function() { UI.mask(); }, false);
        video.addEventListener('error', function() { UI.unmask(); }, false);
        video.addEventListener('canplay', function() { UI.unmask(); }, false);
        video.addEventListener('emptied', function() { UI.mask(); }, false);
        video.addEventListener('ended', function() { self.nextSrc(); }, false);
    },

    nextSrc: function() {
        this.model.currentPos++;
        var self = this,
            video = document.getElementsByTagName('video')[0],
            movie = self.model.movies[self.model.currentPos];

        if(!movie || self.model.currentPos >= self.model.movies.length) {
            // movie wasn't found OR at the end of the list
            return false;
        }

        $(".active").removeClass("active");
        $($("#movie-list .cf").children()[this.model.currentPos]).addClass("active");

        video.src = movie.link;
        video.poster = movie.trailerStill;
        video.load();
        video.play();
    },

    goToPos: function(pos) {
        this.model.currentPos = pos - 1;
        this.nextSrc();
    },

    loadVideo: function(pos) {
        pos = pos || 0;
        if(pos < 0 || pos >= this.model.movies.length) { pos = 0; }
        this.goToPos(pos);
    },

    dealloc: function() {

    }
});
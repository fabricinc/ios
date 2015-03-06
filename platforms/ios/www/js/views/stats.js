var StatsModel = Backbone.Model.extend({
        loadStats: function(callback) {
			var self = this;
            callback = callback || function() {};

            var options = {
	            "action": "getStats"
	        }

	        Api.dispatcher(options, function(stats) {
				stats.totalTrailers = stats.totalTrailers || 0;
				stats.totalPoints = stats.points ? Util.addCommas(stats.points) : "n/a";
				stats.statsWidth = (stats.catsPlayed == 0 || stats.totalCats == 0) ? 0 : Math.round(stats.catsPlayed / stats.totalCats * 100)  + "%";
				stats.streak = stats.streak || "n/a";
				stats.topCat = stats.topCat || "n/a";
				stats.poster = "style='background-image: url(" + stats.poster + ");'" || "";
				stats.catsPlayed = stats.catsPlayed || 0;
				stats.totalQuestions = (stats.totalQuestions !== null && stats.totalQuestions * 1 !== 0) ? (Math.round(stats.correct / stats.totalQuestions  * 100) + "&#37") : "n/a";
				stats.bestDailyScore =  stats.bestDailyScore ? Util.addCommas(stats.bestDailyScore) : "n/a";
				stats.dailyAverage = stats.dailyAverage ? Util.addCommas(stats.dailyAverage) : "n/a";
				
	            self.set(stats);
	            callback();
	        });
	
            return this;
        }
    });

    var StatsView = Backbone.View.extend({
		model: null,
		
        initialize: function(callback) {
			var self = this;
            callback = callback || function() {};

			this.model = new StatsModel();
			
			callback();
            return this;
        },
        render: function(callback) {
			var self = this;
			callback = callback || function() {};
			
			this.model.loadStats(function() {
				APP.models.stats = self.model;
				
				$.get('templates/stats.html', function(html) {
					var html = _.template(html, self.model.toJSON());
		            $("#wrapper").html(html);
		            if (!self.header) {
		                self.header = new HeaderView({ title: "Stats" });
		                $("#wrapper").prepend(self.header.el);
		            }
					callback();
				});
			});
        },
        dealloc: function() {
	
		}
    });
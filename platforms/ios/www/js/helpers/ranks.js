    var Ranks = {
        rankPointsArray: [5000, 14000, 28000, 60000, 95000, 155000, 255000],

        /**
         * Will update a user model with rank information calculated from the gamme's current score (APP.totalScore).         *
         * @param   model   A Backbone User model object. See helpers/user.
         */

        getRankThresholds: function(model) {
            if (!model)
                model = APP.models.currentUser;

            var l = this.rankPointsArray.length,
                i = 0;

            //  Are we at Mogul level?
            if (model.get("totalScore") >= this.rankPointsArray[l - 1]) {
                model.set("rank", APP.strings.ranksArray[l]);
                model.set("nextRankThreshold", false);
            } else {
                for (; i < l; i++) {
                    if (this.rankPointsArray[i] > APP.totalScore) {
                        // Grab our rank and next rank threshold.
                        model.set("rank", APP.strings.ranksArray[i]);
                        model.set("nextRank", APP.strings.ranksArray[i + 1]);
                        model.set("prevRankThreshold", i > 0 ?  this.rankPointsArray[i - 1] :  0);
                        model.set("nextRankThreshold", this.rankPointsArray[i]);
                        model.set("pointsToNextRank", this.rankPointsArray[i] - APP.totalScore);

                        APP.rank = APP.strings.ranksArray[i];
                        APP.nextRank = APP.strings.ranksArray[i + 1];
                        APP.prevRankThreshold = i > 0 ? this.rankPointsArray[i - 1] : 0;
                        APP.nextRankThreshold = this.rankPointsArray[i];
                        APP.pointsToNextRank = (this.rankPointsArray[i] - APP.totalScore);

                        break;
                    }
                }
            }
            return this;
        },

        /**
         * Gets the width of the rank progress indicator based upon current APP.totalScore
         * @returns {*}
         */
        getRankProgressWidth: function(ptWidth) {
            var progressElWidth = ptWidth ? ptWidth : 100, // Percentage if no starting width specified.
                cU = APP.models.currentUser.attributes;
            this.rankProgressWidth =  {pWidth: progressElWidth, width: progressElWidth * (APP.totalScore - APP.prevRankThreshold) / (APP.nextRankThreshold - APP.prevRankThreshold)};

            return this.rankProgressWidth;
        }
    }
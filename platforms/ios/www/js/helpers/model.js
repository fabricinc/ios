// JavaScript Document

var Model = {};

Model.movies = {};
Model.questionCount = 0;

Model.movieFavorites = {};

Model.movieHistory = {};

Model.strings = {

    "ranksArray": ['Extra', 'Stunt Double', 'Supporting Actor','Lead Actor', 'Director', 'Producer', 'Executive Producer', 'Movie Mogul'],

    "interface": {
        "back": "Back",
        "exit": "Exit",
        "previous": "previous",
        "next": "next"
    },

    "tutorial": {
        "title": "Tutorial"
    },

    "myProfile": {
        "title": "My Profile",
        "monthlyRank": "Monthly Rank: ",
        "nextRankIn": function(points) {return 'Next rank in ' + points + ' points.'},
        "trailersPlayed": "Trailers Played: ",
        "percentageCorrect": "Percentage Correct: ",
        "bestScore": "Monthly Points: ",
        "topCategory": "Top Genre: ",
        "myTrailers": "Lists"
    },

    "help": {
        "title": "Help"
    },

    "roundComplete": {
        "title": "Round Complete",
        "currentRank": function(rank) {return 'Rank: ' + rank},
        "nextRankString": "Next Rank: ?", //fixed content
        "stripInstructions": "Tap each thumbnail for more options.",
        "roundCompleteTitle": "Round Complete",
        //  We need the <span class="score-ticker"> in this string in order to hook into that element for the ticker animation
        "scoreString": function(correct, outOf){return '<strong>' + correct + '</strong>' + ' out of ' + '<strong>' + outOf + '</strong>' + ' questions correct' },
        "rankLabel": "Rank: "
    },

    "main": {
        "mainStart": "New Releases",
        "mainSelect": "Categories"
    },

    "showWelcomeMessaging": {
        "levelUp": '<span class="level-up-congrats">Congratulations!</span><br /><br />You\'ve achieved the rank of <span class="level-up-messaging"></span>.',
        "screenRmAppend": '<br /><br />The <span class="emphasis">Screening Room</span> is now unlocked.'
    },

    "register": {
        "reggie": "Create Account"
    },

    "login": {
        "loginButton": "login"
    },

    "selectMovie": {
        "theatricalRelease": function(date) { return 'Release: ' + date}
    },

    "home": {
//        "facebook": 'Connect with Facebook',
//        "fabric": 'Fabric account'
    },

    "movieStrip": {
        "playTrailer": "Watch trailer",
        "favorite": "Add to list",
        "share": "Share",
        "buyRent": "Buy/Rent",
        "facebook": "Share with Facebook",
        "twitter": "Share with Twitter"
    },

    introduction: {
        selectMovie: false,
        lists: false
    }



}



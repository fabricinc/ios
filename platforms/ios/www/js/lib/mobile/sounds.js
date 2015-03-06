    var Sounds = {}

// sound files
var SOUNDTRACK_URL = 'sounds/trailerpopmenu',
    HOTSTREAK_URL = 'sounds/hotstreak',
    MENUSLIDE_URL = 'sounds/menuslide',
    RANKACHIEVEMENT_URL = 'sounds/rankachievement',
    RIGHTANSWER_URL = 'sounds/rightanswer',
    STANDARDBUTTON_URL = 'sounds/standardbutton',
    STARTGAME_URL = 'sounds/startgame',
    WRONGANSWER_URL = 'sounds/wronganswer',
    SCORETICK_URL = 'sounds/scoretick',
    CLICK_URL = 'sounds/click',
    BACK_URL = 'sounds/back';

// reference names
var SOUNDTRACK_TAG = 'soundtrackTag',
    HOTSTREAK_TAG = 'hotStreakTag',
    MENUSLIDE_TAG = 'menuSlideTag',
    RANKACHIEVEMENT_TAG = 'rankAchievementTag',
    RIGHTANSWER_TAG = 'rightAnswerTag',
    STANDARDBUTTON_TAG = 'standardButtonTag',
    STARTGAME_TAG = 'startGameTag',
    WRONGANSWER_TAG = 'wrongAnswerTag',
    SCORETICK_TAG = 'scoretickTag',
    CLICK_TAG = 'clickTag',
    BACK_TAG = 'backTag';

// mime types
var WAV_MIME_TYPE = 'audio/wav',
    MP3_MIME_TYPE = 'audio/mp3',
    CAF_MIME_TYPE = 'audio/caf';

var DEBUG = true;

Sounds.preloadSoundFiles = function() {
	
    if(Util.isMobile()) {
//        LowLatencyAudio.preloadAudio(SOUNDTRACK_TAG, SOUNDTRACK_URL + ".caf", 1);
        LowLatencyAudio.preloadFX(HOTSTREAK_TAG, HOTSTREAK_URL + ".caf", LowLatencyAudioSuccessHandler, LowLatencyAudioErrorHandler);
//        LowLatencyAudio.preloadAudio(MENUSLIDE_TAG, MENUSLIDE_URL + ".caf", 1);
        LowLatencyAudio.preloadFX(RANKACHIEVEMENT_TAG, RANKACHIEVEMENT_URL + ".caf");
        LowLatencyAudio.preloadFX(RIGHTANSWER_TAG, RIGHTANSWER_URL + ".caf");
        LowLatencyAudio.preloadFX(STANDARDBUTTON_TAG, STANDARDBUTTON_URL + ".caf");
        LowLatencyAudio.preloadFX(WRONGANSWER_TAG, WRONGANSWER_URL + ".caf");
//        LowLatencyAudio.preloadAudio(SCORETICK_TAG, SCORETICK_URL + ".caf", 1);
        LowLatencyAudio.preloadFX(CLICK_TAG, CLICK_URL + ".caf");
        LowLatencyAudio.preloadFX(BACK_TAG, BACK_URL + ".caf");
        LowLatencyAudio.preloadFX(STARTGAME_TAG, STARTGAME_URL + ".caf");
    }
	
}

// Following are the public methods to trigger the sound effects

Sounds.hotStreak = function() {
    playSoundEffect(HOTSTREAK_TAG);
}

Sounds.menuSlide = function() {
    playSoundEffect(MENUSLIDE_TAG);
}

Sounds.rankAchievement = function() {
    playSoundEffect(RANKACHIEVEMENT_TAG);
}

Sounds.rightAnswer = function() {
    playSoundEffect(RIGHTANSWER_TAG);
}

Sounds.standardButton = function() {
    playSoundEffect(STANDARDBUTTON_TAG);
}

Sounds.startGame = function() {
    playSoundEffect(STARTGAME_TAG);
}

Sounds.wrongAnswer = function() {
    playSoundEffect(WRONGANSWER_TAG);
}

Sounds.scoreTick = function() {
    playSoundEffect(SCORETICK_TAG);
}

Sounds.click = function() {
    playSoundEffect(CLICK_TAG);
}

Sounds.back = function() {
    playSoundEffect(BACK_TAG);
}

// this should not be called externally
function playSoundEffect(tag) {
    var fileType = ".caf";
    if (localStorage.soundEffects === "false") return;

    if (Util.isMobile()) {

        // mobile audio is really simple
        LowLatencyAudio.play(tag);
    } else {
        // web browser audio
        var audio = document.createElement("audio");

        if(audio.canPlayType(MP3_MIME_TYPE)) {
            fileType = ".mp3";
        }

        if(audio.canPlayType(MP3_MIME_TYPE) || audio.canPlayType(CAF_MIME_TYPE)) {
            switch(tag) {
                case HOTSTREAK_TAG:
                    audio.src = HOTSTREAK_URL
                    break
                case MENUSLIDE_TAG:
                    audio.src = MENUSLIDE_URL
                    break
                case RANKACHIEVEMENT_TAG:
                    audio.src = RANKACHIEVEMENT_URL
                    break
                case RIGHTANSWER_TAG:
                    audio.src = RIGHTANSWER_URL
                    break
                case STANDARDBUTTON_TAG:
                    audio.src = STANDARDBUTTON_URL
                    break
                case STARTGAME_TAG:
                    audio.src = STARTGAME_URL
                    break
                case WRONGANSWER_TAG:
                    audio.src = WRONGANSWER_URL
                    break
                case SCORETICK_TAG:
                    audio.src = SCORETICK_URL
                    break
                case CLICK_TAG:
                    audio.src = CLICK_URL
                    break
                case BACK_TAG:
                    audio.src = BACK_URL
                    break
            }

            audio.src = audio.src + fileType;
            audio.play();
        }
    }
}

// this should only be used for debugging
function LowLatencyAudioSuccessHandler(result) {
    if(DEBUG)
        Util.log( "PGLowLatency success: " + result );
}

// this should only be used for debugging
function LowLatencyAudioErrorHandler(error) {
    if(DEBUG)
        Util.log( "PGLowLatency error: " + error );
}

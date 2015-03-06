
var Kiip = function() {
};

Kiip.prototype.init = function(api_key, api_secret, successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
	return cordova.exec(successCallback,
                        failureCallback,
                        'KiipPlugin',
                        'initializeKiip',
                        [api_key, api_secret]);
};

Kiip.prototype.saveMoment = function(key, successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
	return cordova.exec( successCallback, failureCallback, 'KiipPlugin', 'saveMoment', [key]);
};

Kiip.prototype.startSession = function(successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
	return cordova.exec(successCallback, failureCallback, 'KiipPlugin', 'startSession', []);
};

Kiip.prototype.endSession = function(successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
	return cordova.exec(successCallback, failureCallback, 'KiipPlugin', 'endSession', []);
};

Kiip.prototype.listenContent = function(successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
    return cordova.exec(successCallback, failureCallback, 'KiipPlugin', 'onContent', []);
};

Kiip.prototype.listenSwarm = function(successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
    return cordova.exec(successCallback, failureCallback, 'KiipPlugin', 'onSwarm', []);
};

// ########################################################################################
// Methods Added by JFP - 11/15/2012
// ########################################################################################

// saveValueMoment added by JFP on 11/15/2012
// created new method instead of overriding saveMoment
// value thresholds don't work in test mode
Kiip.prototype.saveValueMoment = function(key, value, successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
    Util.log("value = " + value);
	return cordova.exec( successCallback, failureCallback, 'KiipPlugin', 'saveValueMoment', [key, value]);
};

// accepts any string as argument
Kiip.prototype.setAlias = function(alias, successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
    Util.log("setting alias = " + alias);
    return cordova.exec( successCallback, failureCallback, 'KiipPlugin', 'setAlias', [alias]);
}

// expects a date in MM/dd/YYYY format, or will thrown error
Kiip.prototype.setBirthday = function(birthday, successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
    Util.log("setting birthday = " + birthday);
    return cordova.exec( successCallback, failureCallback, 'KiipPlugin', 'setBirthday', [birthday]);
}

// expects valid email, but won't throw error if email is not valid format
Kiip.prototype.setEmail = function(email, successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
    Util.log("setting email = " + email);
    return cordova.exec( successCallback, failureCallback, 'KiipPlugin', 'setEmail', [email]);
}

// expects either "Male" or "Female" as argument
Kiip.prototype.setGender = function(gender, successCallback, failureCallback) {
    if (!Util.isMobile()) return false;
    Util.log("setting gender = " + gender);
    return cordova.exec( successCallback, failureCallback, 'KiipPlugin', 'setGender', [gender]);
}

// ###########################################################################################
// End of additions by JFP
// ###########################################################################################

kiip = new Kiip();


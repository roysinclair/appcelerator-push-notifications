/*
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 ---------- ----- DEFINE CUSTOM GLOBAL VALUES ---------- -----
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 */
// Set Enviroment to local or live 
var ENV = "live";

// Alloy.Globals.PUSHSERVICE set the website URI for the Push notification API
if (ENV == "local") {
	Alloy.Globals.PUSHSERVICE = 'http://localhost/demo-push-notifications';
} else {
	Alloy.Globals.PUSHSERVICE = 'http://example.com/demo-push-notifications';
}

/*
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 ---------- ---------- ---------- --- iOS App Resume ---- ---------- ---------- ---------- --------
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
 */
if (OS_IOS) {
	Ti.App.addEventListener("resumed", function(e) {
		Ti.UI.iOS.setAppBadge = 0;
		Ti.UI.iOS.AppBadge = 0;
		Ti.App.Properties.setInt('app:Badge', 0);
	});
}

function registerAndroid() {

	var TiGoosh = require('ti.goosh');
	TiGoosh.registerForPushNotifications({

		// The callback to invoke when a notification arrives.
		callback : function(e) {
			Ti.API.info('Notifications: callback e is ' + JSON.stringify(e));
			var appStatus = e.inBackground;
			// True OR False
			var appAlert = JSON.parse(e.data).alert;

			Ti.API.info('Received push: ' + JSON.stringify(e));
			Ti.API.info('Received appStatus: ' + appStatus);

			// ---------- -------- PUSH: Message received ---------- ---------
			// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------

			if (appStatus === true) {
				return;
			}
		},

		// The callback invoked when you have the device token.
		success : function(e) {

			// Send the e.deviceToken variable to your PUSH server
			Ti.API.info('Notifications: device token is ' + e.deviceToken);
			postRegisterDeviceToken(e.deviceToken);

		},

		// The callback invoked on some errors.
		error : function(err) {
			Ti.API.error('Notifications: Retrieve device token failed', err);
		}
	});

}

function postRegisterDeviceToken(deviceToken) {

	var percent_done = 0;

	if (OS_IOS) {
		var appOS = "iOS";
	} else if (OS_ANDROID) {
		var appOS = "ANDROID";
	}

	Ti.API.info('postRegisterDeviceToken deviceToken >>>> ' + deviceToken);
	Ti.App.Properties.setString('app:deviceToken', deviceToken);
	Ti.API.info('postRegisterDeviceToken app:registerDeviceToken >>>> ' + Ti.App.Properties.getString('app:deviceToken'));

	var params = {
		request : 'register',
		deviceToken : deviceToken,
		appVersion : Titanium.App.version,
		appOS : appOS
	};

	var registerDeviceTokenParams = JSON.stringify(params);

	var xhr = Ti.Network.createHTTPClient({

		onload : function(e) {

			if (JSON.parse(this.responseText).success == true) {
				Ti.API.info('postRegisterDeviceToken success');
				Ti.App.Properties.setBool('app:registerDeviceToken', true);
				Ti.App.Properties.setString('app:deviceToken', deviceToken);
				Ti.API.info('postRegisterDeviceToken app:registerDeviceToken >>>> ' + Ti.App.Properties.getBool('app:registerDeviceToken'));

			} else {

			}

		},

		onerror : function(e) {
			Ti.API.info("e.error: " + e.error);
		},

		onreadystatechange : function(e) {
			Ti.API.info("onreadystatechange: " + this.readyState);
		},

		onsendstream : function(e) {

			var curr_percent_done = parseInt(e.progress * 100);
			if (percent_done == curr_percent_done)
				return;
			percent_done = curr_percent_done;
			Ti.API.info(percent_done + "% done. readyState: " + this.readyState);

		},

		timeout : 25000
	});

	function upload() {

		Ti.API.info("STARTING UPLOAD");
		var url = Alloy.Globals.PUSHSERVICE + "/users.php";
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.send(registerDeviceTokenParams);
		Ti.API.info('xhr.send(): ' + registerDeviceTokenParams);
	}

	upload();

	setTimeout(function() {

		Ti.API.info("ABORTING UPLOAD - calling xhr.abort");
		xhr.abort();

	}, 25000);

}

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- -------- IOS registerForPush service ----------- ---------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
function iosActivatePush() {

	if (Titanium.Platform.model == 'Simulator') {
		Ti.API.info(':::::: LOG :::::: Simulator can\'t register for push services');
		return;
	}

	// Check if the device is running iOS 8 or later
	if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {

		// Wait for user settings to be registered before registering for push notifications
		Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {

			// Remove event listener once registered for push notifications
			Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);

			Ti.Network.registerForPushNotifications({
				success : deviceTokenSuccess,
				error : deviceTokenError,
				callback : receivePush
			});
		});

		// Register notification types to use
		Ti.App.iOS.registerUserNotificationSettings({
			types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
		});
	}

	// For iOS 7 and earlier
	else {
		Ti.Network.registerForPushNotifications({
			// Specifies which notifications to receive
			types : [Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND],
			success : deviceTokenSuccess,
			error : deviceTokenError,
			callback : receivePush
		});
	}

	// Process incoming push notifications
	function receivePush(e) {
		understandingPush(e);
	}

	// Save the device token for subsequent API calls
	function deviceTokenSuccess(e) {

		Ti.App.Properties.setString('app:deviceToken', e.deviceToken);
		deviceToken = e.deviceToken;

		postRegisterDeviceToken(deviceToken);
		Ti.API.info('******** deviceToken ***********  ' + deviceToken);

	}

	function deviceTokenError(e) {
		alert('Failed to register for push notifications! ' + e.error);
	}

}

function understandingPush(e) {

	var appStatus = e.inBackground;
	// True {APP IS IN THE BACKGROUND} OR False {APP IS OPEN}
	var appAlert = e.data.alert;
	Ti.API.info('Received push: ' + JSON.stringify(e));
	Ti.API.info('Received appStatus: ' + appStatus);

	// ---------- -------- PUSH: Message received ---------- ---------
	// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------

	if (appStatus === true) {

		var currentBadgeValue = Ti.App.Properties.getInt('app:Badge') || 0;
		Ti.UI.iOS.setAppBadge = currentBadgeValue + 1;
		Ti.UI.iOS.AppBadge = currentBadgeValue + 1;
		return;
	}

	
	// Reset Phone Badge
	//Ti.API.info('Received getAppBadg Before: ' + JSON.stringify(Ti.UI.iOS.getAppBadge));
	Ti.UI.iOS.setAppBadge = 0;
	Ti.UI.iOS.AppBadge = 0;
	Ti.App.Properties.setInt('app:Badge', 0);
	Ti.API.info('Received app:Badge: ' + Ti.App.Properties.getInt('app:Badge'));
	return;

}

function postUnRegisterDeviceToken() {

	var percent_done = 0;

	if (OS_IOS) {
		var appOS = "iOS";
	} else if (OS_ANDROID) {
		var appOS = "ANDROID";
	}

	var deviceToken = Titanium.App.Properties.getString('app:deviceToken');

	var params = {
		request : "unregister",
		deviceToken : deviceToken,

	};
	var registerDeviceTokenParams = JSON.stringify(params);
	var xhr = Ti.Network.createHTTPClient({

		onload : function(e) {
			
		},
		onerror : function(e) {
			Ti.API.info("e.error: " + e.error);
		},
		onreadystatechange : function(e) {
			Ti.API.info("onreadystatechange: " + this.readyState);
		},
		onsendstream : function(e) {
			var curr_percent_done = parseInt(e.progress * 100);
			if (percent_done == curr_percent_done)
				return;
			percent_done = curr_percent_done;
			Ti.API.info(percent_done + "% done. readyState: " + this.readyState);
		},
		timeout : 15000
	});

	function upload() {

		Ti.API.info("STARTING UPLOAD");
		var url = Alloy.Globals.PUSHSERVICE + "/users.php";
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.send(registerDeviceTokenParams);
		Ti.API.info('xhr.send(): ' + registerDeviceTokenParams);
	}

	upload();

	setTimeout(function() {

		Ti.API.info("ABORTING UPLOAD - calling xhr.abort");
		xhr.abort();

	}, 15000);

}
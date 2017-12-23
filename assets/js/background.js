(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-17631526-15', 'auto');
ga('set', 'checkProtocolTask', null);
ga('require', 'displayfeatures');
ga('send', 'pageview');
var extVersion = chrome.runtime.getManifest().version;
ga('send', 'event', 'background', 'version', extVersion);
var UILanguage = chrome.i18n.getUILanguage();
ga('send', 'event', 'background', 'lang', UILanguage);
var eventTrack = function(cat, act, label) {
	ga('send', 'event', cat, act, label);
}
var config = {
	autoOpen: true,
	hour: 0,
	min: 5,
};
var sync, lsKey = 'signV41';

getConfig();

function syncStart() {
	sync = setInterval(function() {
		if(!config.autoOpen) {
			clearInterval(sync);
			return;
		}
		var now = new Date();
		if(now.getHours() == config.hour && now.getMinutes() == config.min && now.getDate() != localStorage[lsKey]) {
			open('https://www.gamer.com.tw/?utm_source=gamerAutoSign&utm_medium=popup');
			eventTrack('sign', 'time', config.hour + ':' + config.min);
			localStorage[lsKey] = now.getDate();
		}
	}, 20000);
}
function open(url) {
	chrome.windows.getAll(function(windows) {
		var hasWindow = windows.length > 0;
		if(hasWindow) {
			chrome.tabs.create({
				url: url,
				active: false
			});
		}
		else {
			chrome.windows.create({
				url: url,
				state: 'minimized',
			});
		}
	});
}
function getConfig() {
	chrome.storage.sync.get(config, function(setting) {
		config.autoOpen = setting.autoOpen;
		config.hour = setting.hour;
		config.min = setting.min;
	});
	if(config.autoOpen) {
		syncStart();
	}
}
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	var param = message.param;
	switch(message.method) {
		case 'ga':
			eventTrack(param.cat, param.act, param.label);
			break;
		case 'uid':
			ga('set', 'userId', param.uid);
			break;
		case 'sign':
			localStorage[lsKey] = param.date;
			break;
		case 'update':
			getConfig();
			break;
	}
});
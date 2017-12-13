document.addEventListener('DOMContentLoaded', function() {
	var autoOpen = document.querySelector('#autoOpen'),
		hour = document.querySelector('#hour'),
		min = document.querySelector('#min');
	chrome.storage.sync.get({
		autoOpen: true,
		hour: 0,
		min: 5,
	}, function(setting) {
		autoOpen.checked = setting.autoOpen;
		hour.value = setting.hour;
		min.value = setting.min;
	});
	autoOpen.addEventListener('change', function(e) {
		chrome.storage.sync.set({
			autoOpen: e.target.checked
		}, function() {
			chrome.runtime.sendMessage({
				method: 'update'
			}, function(){});
		});
	});
	hour.addEventListener('change', function(e) {
		var value = parseInt(e.target.value);
		value = value < 0 ? 0 : value;
		value = value > 23 ? 23 : value;
		chrome.storage.sync.set({
			hour: value
		}, function() {
			chrome.runtime.sendMessage({
				method: 'update'
			}, function(){});
		});
	});
	min.addEventListener('change', function(e) {
		var value = parseInt(e.target.value);
		value = value < 0 ? 0 : value;
		value = value > 59 ? 59 : value;
		chrome.storage.sync.set({
			min: value
		}, function() {
			chrome.runtime.sendMessage({
				method: 'update'
			}, function(){});
		});
	});
});
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-17631526-15', 'auto');
ga('set', 'checkProtocolTask', null);
ga('require', 'displayfeatures');
ga('send', 'pageview', '/options.html');
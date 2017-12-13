(function() {
	'use strict';
	var BAHAID = getCookie('BAHAID');
	if(BAHAID) {
		SetUID(BAHAID.toLowerCase());
	}
	Track('view', 'hostname', window.location.host);
	Track('view', 'page', window.location.href.replace(window.location.protocol + '//' + window.location.host, ''));
	if(BAHAID && window.location.host == 'www.gamer.com.tw') {
		var signbtn = $('#signin-btn');
		if(!signbtn.length) {
			location.href = 'https://www.gamer.com.tw/index2.php?ad=N&utm_source=gamerAutoSign&utm_medium=popup';
			return;
		}
		else if(!signbtn.hasClass('is-active')) {
			var script = document.createElement('script');
			script.innerHTML = 'Signin.start($(\'#signin-btn\'));';
			document.documentElement.appendChild(script);
			chrome.runtime.sendMessage({
				method: 'sign',
				param: {
					date: (new Date()).getDate()
				}
			}, function(){});
		}
	}
}());
function SetUID(uid) {
	chrome.runtime.sendMessage({
		method: 'uid',
		param: {
			uid: uid
		}
	}, function(){});
}
function getCookie(name) {
	var value = '; ' + document.cookie;
	var parts = value.split('; ' + name + '=');
	if(parts.length == 2) return parts.pop().split(';').shift();
}
function Track(cat, act, label) {
	chrome.runtime.sendMessage({
		method: 'ga',
		param: {
			cat: cat,
			act: act,
			label: label
		}
	}, function(){});
}
var featherEditor = new Aviary.Feather({
	apiKey : 'cf618685d8886859',
	apiVersion : 3,
	theme : 'dark', // Check out our new 'light' and 'dark' themes!
	tools : 'all',
	onSave : function(imageID, newURL) {
		// var img = document.getElementById(imageID);
		// img.src = newURL;
		if (window.io) {
			socket.emit('getImageBase64', newURL);
		}
	},
	onError : function(errorObj) {
		alert(errorObj.message);
	}
});

function launchEditor() {
	featherEditor.launch({
		image : 'resultImg'
	});
	return false;
}
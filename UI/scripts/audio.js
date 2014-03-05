function play(id) {
	var elm = document.getElementById(id);
	if (elm && elm.play) {
		elm.play();
	}
}
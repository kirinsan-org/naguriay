$(document).ready(function(){
    

var cameraReady = false;

//APIを格納
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

//window.URLのAPIをすべてwindow.URLに統一
window.URL = window.URL || window.webkitURL;

if (!navigator.getUserMedia) {
    alert("getUserMedia非対応環境");
}

// 変数
var $canvas = $("#canvas"),
    ctx = $canvas.get(0).getContext("2d"),
    $video = $("#video"),
    $btnStart = $("#start"),
    $btnStop = $("#stop"),
    $btnPhoto = $("#photo"),
    videoObj = {
        video: true,
        audio: false
    };

    function initCamera(){
    	if(!cameraReady){
    		var localMediaStream;
	    
		    if (navigator.getUserMedia) {
		        navigator.getUserMedia(videoObj, function(stream) {
		            localMediaStream = stream;
		            $video.attr({"src":window.URL.createObjectURL(localMediaStream)})
		            
		        }, function(error) {
		            console.error("getUserMedia error: ", error);
		        });
		        
		        $btnStop.bind("click", function() {
		            localMediaStream.stop();
		        });
		        
		        $btnPhoto.bind("click", function() {
		        	$("#takephoto .strobe").show()
		            $canvas.attr({"width":640});
		            $canvas.attr({"height":480});
		            

		            ctx.drawImage($video.get(0), 0, 0, $canvas.get(0).width, $canvas.get(0).height);
		            $("#takephoto .strobe").fadeOut("slow");

		            $("#takephoto .preview img").eq(0).attr({"src":$canvas.get(0).toDataURL("image/png")})
		            UItoolkit.photo.open()

		            return false;
		        });
		    }
		    cameraReady = true;
    	}
    }

$("#title .start").bind({"click":function(){
	
	setTimeout(function(){
		$('html,body').animate({scrollTop:$("#takephoto").offset().top},'fast','swing',function(){
			$("#takephoto").addClass("on")
		});
	},200)}})

$btnStart.bind("click", function() {
    
});

initCamera();


})
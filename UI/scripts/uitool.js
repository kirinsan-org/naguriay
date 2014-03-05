var UItoolkit ={


	gauge:function($target){
		//ゲージ制御
		var $bar = $target.find(".gauge")
		return {
			set:function(perc){ //ゲージ幅の設定(1>で)
				if(perc > 1){perc = 1}
				console.log(perc,$bar,(perc*100)+"%");
				$bar.css({"width":(perc*100)+"%"});
			},
			killMotion:function(bool){ //ゲージ幅の設定(1>で)
				if(bool){
					$bar.addClass("killmotion")
				}else{
					$bar.removeClass("killmotion")
				}
				
			},
			isSlow:function(bool){ //ゲージ幅の設定(1>で)
				if(bool){
					$bar.addClass("slow")
				}else{
					$bar.removeClass("slow")
				}
				
			},
			reset:function(perc){ //ゲージ幅を100%にリセット。
				$bar.css({"width":"100%"});
			}

		}
	},//gauge

	body:{
		// hands:function($tgt){

		// },
		hand:function($tgt){
			return {
				punch:function(){

					if(!$tgt.hasClass("punch")){
						$tgt.addClass("punch");
						setTimeout(function(){$tgt.removeClass("punch")},80);
					}

				},
				doGuard:function(){

					if(!$tgt.hasClass("guard")){
						$tgt.addClass("guard");
					}

				},
				releaseGuard:function(){
					if($tgt.hasClass("guard")){
						$tgt.removeClass("guard");
					}

				}
			};
		}
	},

	photo:{
		open:function(){
			$("#takephoto .preview").fadeIn("slow",function(){$(this).addClass("on")})
			$("#takephoto").addClass("previewing")
		},
		close:function(){
			$("#takephoto .preview").removeClass("on");
			setTimeout(function(){$("#takephoto .preview").fadeOut("slow")},100)
			$("#takephoto").removeClass("previewing")
		}
	},

	doorClose:function(){
		$("#metaldoor").addClass("close")
	}

}




$(document).ready(function(){
	$("#takephoto .preview .denine").eq(0).bind({"click":function(){
		UItoolkit.photo.close()	
	}})

	$("#takephoto .preview .accept").eq(0).bind({"click":function(){
		$('html,body').animate({scrollTop:$("#beatninja").offset().top},'normal','swing',function(){
			$("#beatninja").addClass("on")
		});
		socket.emit('sendImage', $("#takephoto .preview img").eq(0).attr("src"))
	}})
	
})
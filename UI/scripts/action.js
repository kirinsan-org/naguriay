var threshold = -1300;
var punch = false;
var guard = false;
var socket;
var hp = 1.0;
var faceElm = document.querySelector('#enemy .face');
var gameEnd = false;
var enemyCanvas = document.getElementById('enemyCanvas');
var enemyCanvasCtx = enemyCanvas.getContext('2d');
var $ninja = $("#ninja")

var ninja = {
	kill : function() {
		$("#beatninja").css({
			"backgroundColor" : "#F00"
		});
		$ninja.addClass("killed");

		setTimeout(function() {
			$ninja.css({
				"display" : "none"
			}).removeClass("killed");
			$ninja.fadeIn();
			$("#beatninja").css({
				"backgroundColor" : "#FFF"
			});
		}, 700);

	}
}

// ゲーム終了後の相手の顔のイメージデータを入れる
var enemyResultImage;
// ゲーム終了後の自分の顔のイメージデータを入れる
var myResultImage;

if (window.io) {

	socket = io.connect();
	socket.on('punch', function(data) {
		if (gameEnd || !isReady()) {
			return;
		}

		if (data.socketId === socket.socket.sessionid) {
			return;
		}

		if (Math.random() < 0.5) {
			hands.left.punch();
		} else {
			hands.right.punch();
		}

		if (!guard) {
			stage.shake();
			hp -= 0.1;
			gauge.self.set(hp);
			if (socket) {
				socket.emit('updateHP', hp);
			}

			if (hp < 0.01) {
				socket.emit('lose');
			}
		}

		play('audio-punch');
	}).on('doGuard', function(data) {
		if (data.socketId === socket.socket.sessionid) {
			return;
		}

		hands.left.doGuard();
		hands.right.doGuard();
	}).on('releaseGuard', function(data) {
		if (data.socketId === socket.socket.sessionid) {
			return;
		}

		hands.left.releaseGuard();
		hands.right.releaseGuard();
	}).on('updateHP', function(data) {
		if (gameEnd || !isReady()) {
			return;
		}

		if (socket.socket.sessionid === data.socketId) {
			gauge.self.set(data.hp);
		} else {
			gauge.enemy.set(data.hp);
			punchEffect(enemyCanvasCtx);
		}
		gauge.enemy.set(data.hp);
	}).on('faceImage', function(data) {
		var base64Image = data.image;
		if (socket.socket.sessionid !== data.socketId) {
			// 相手の顔
			face.set(base64Image);
		}
	}).on('startGame', function() {
		startGame();
	}).on('gameEnd', function(data) {
		if (gameEnd) {
			return;
		}

		// ゲーム終了
		gameEnd = true;
		$('#metaldoor').addClass('close');
		setTimeout(function() {
			$('html,body').scrollTop($("#result").offset().top);
		}, 600)
		play('audio-bell');

		// 相手の顔を送信
		enemyResultImage = enemyCanvas.toDataURL();
		socket.emit('sendResultImage', enemyResultImage);
		renderResult();

		// if (data.loserId === socket.socket.sessionid) {
		// // 負け
		// } else {
		// // 勝ち
		// }
	}).on('sendResultImage', function(data) {
		if (data.socketId !== socket.socket.sessionid) {
			myResultImage = data.image;
			renderResult();
		}
	}).on('faceDetectError', function(err) {
		alert(JSON.stringify(err));
	}).on('setImageBase64', function(imageBase64) {
		$('#resultImg').attr('src', imageBase64);
	});
}

function startGame() {
	console.log('startGame!');
	// UItoolkit.photo.close();
	$('#metaldoor').removeClass('close open');
	setTimeout(function() {
		$("#enemy .face").addClass("ready");
	}, 600);
	play('audio-bell-one');
}

var host = '127.0.0.1';
var matchRes = location.search.match(/host=([a-zA-Z0-9\.]+)/);
if (matchRes) {
  host = matchRes[1];
}

Leap.loop({
  host : host,
	enableGestures : true
}, function(frame) {
	if (frame.gestures[0] && frame.gestures[0].type === 'swipe' && !$ninja.hasClass('killed')) {
		ninja.kill();
		$('.killedcounter').append('<li>');
	}

	if (gameEnd || !isReady()) {
		return;
	}

	frame.hands.forEach(processHand);

	// guard
	var nextGuard = frame.fingers.length >= 4;
	if (guard && !nextGuard) {
		if (socket) {
			socket.emit('releaseGuard');
		}
	} else if (!guard && nextGuard) {
		if (socket) {
			socket.emit('doGuard');
		}
	}
	guard = nextGuard;
});

function processHand(hand) {
	if (!punch) {
		if (hand.palmVelocity[2] < threshold) {
			punch = true;
			setTimeout(resetPunch, 500);
			if (socket) {
				socket.emit('punch');
			}
		}
	}
}

function resetPunch() {
	punch = false;
}

function punchEffect(ctx) {
	var size = 200;
	var processStartX = Math.floor(Math.random() * (ctx.canvas.width - size));
	var processStartY = Math.floor(Math.random() * (ctx.canvas.height - size));
	var img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	var newImg = ctx.createImageData(size, size);

	for (var y = 0; y < size; y++) {
		for (var x = 0; x < size; x++) {
			var diffX = (newImg.width / 2 - x) / newImg.width;
			var diffY = (newImg.height / 2 - x) / newImg.height;
			var fromX = processStartX + x - Math.floor(diffX * 20);
			var fromY = processStartY + y - Math.floor(diffY * 20);
			copyPixel(img, fromX, fromY, newImg, x, y);
		}
	}
	ctx.putImageData(newImg, processStartX, processStartY);

	function process(px) {
		px.r += 100;
		return px;
	}

	function copyPixel(fromData, fromX, fromY, toData, toX, toY) {
		var fromIdx = (fromX + fromY * fromData.width) * 4;
		var toIdx = (toX + toY * toData.width) * 4;
		toData.data[toIdx] = fromData.data[fromIdx];
		toData.data[toIdx + 1] = fromData.data[fromIdx + 1];
		toData.data[toIdx + 2] = fromData.data[fromIdx + 2];
		toData.data[toIdx + 3] = fromData.data[fromIdx + 3];
	}

}

function isReady() {
	return faceElm.classList.contains('ready');

	// return true;
}

function renderResult(argument) {
	if (enemyResultImage && myResultImage) {

		var me = new Image();
		me.src = myResultImage;
		var enemy = new Image();
		enemy.src = enemyResultImage;

		setTimeout(function() {
			var canvas = $('.resultRendered')[0];
			var ctx = canvas.getContext('2d');
			var bg = document.getElementById('skyimage');
			ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, canvas.width, canvas.height);
			ctx.drawImage($('.resultImg')[0], 0, 0);
			var meHeight = 512 / me.width * me.height;
			var enemyHeight = 512 / enemy.width * enemy.height;
			ctx.drawImage(me, 0, 0, me.width, me.height, 120, 25 + (512 - meHeight) / 2, 512, meHeight);
			ctx.drawImage(enemy, 0, 0, enemy.width, enemy.height, 1280, 25 + (512 - enemyHeight) / 2, 512, enemyHeight);

			var imageData = canvas.toDataURL();
			$('.resultImg').attr('src', imageData);
			$('#metaldoor').addClass('open');
			setTimeout(function() {
				$('#metaldoor').removeClass('close open');
			}, 600);

			setTimeout(function() {
				$("#result").addClass("ready");
			}, 1000);

		}, 500);
	}
}

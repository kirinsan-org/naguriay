var app = require('express.io')(),
    flashfoto = require('./flashfoto'),
    fs = require('fs'),
    request = require('request');

app.configure(require('./configure'));
app.http().io();

var state = {
    player1: {
        prepared: false
    },
    player2: {
        prepared: false
    }
};

var hosts = require('./hosts');
var player1Host = hosts.player1 || '127.0.0.1';
var player2Host = hosts.player2 || '127.0.0.1';

// one player must connect to this end point
app.get('/player1', function(req, res) {
  req.session.name = 'player1';
  state.player1.prepared = false;
  res.redirect('/?host=' + player1Host);
});

// and another must connect to this
app.get('/player2', function(req, res) {
  req.session.name = 'player2';
  state.player2.prepared = false;
  res.redirect('/?host=' + player2Host);
});

// note: This app is considered only 2 players connect each end point.
// "messaging to another player" is implemented by app.io.broadcast (io.sockets.broadcast) for simple coding.

// Face image creation
app.io.route('sendImage', function(req) {
    var base64 = req.data;
    var matchRes = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matchRes) {
        return;
    }

    var imageType = matchRes[1];
    var base64Body = matchRes[2];

    var img = new Buffer(base64Body, 'base64');
    var format = imageType.split('/')[1];

    var tmpImgName = req.io.socket.id + '.' + format;
    var filepath = __dirname + '/tmp/' + tmpImgName;
    var generatedFaceFilePath = __dirname + '/tmp/face-' + tmpImgName;

    // save received image to local temp file
    fs.writeFile(filepath, img, function(err) {
        if (err) {
            return;
        }

        // request face image creation
        flashfoto.generateFaceImage(filepath, {
            format: format
        }, function(err, res, image) {
            if (err) {
                req.io.emit('faceDetectError', err);
                console.error(err);
                return;
            }

            // send face image to client
            var faceImage = 'data:image/png;base64,' + image.toString('base64');
            app.io.broadcast('faceImage', {
                socketId: req.io.socket.id,
                image: faceImage
            });

            if (req.session.name === 'player1') {
                state.player2.prepared = true;
            } else if (req.session.name === 'player2') {
                state.player1.prepared = true;
            }

            if (state.player1.prepared && state.player2.prepared) {
                app.io.broadcast('startGame');
            }

            // for debug
            // fs.writeFile(generatedFaceFilePath, image, function(err) {
            //     console.log('done');
            // });
        });
    });
});

app.io.route('enemyFacePrepared', function(req) {
    req.io.broadcast('enemyFacePrepared', {
        socketId: req.io.socket.id
    });
});
app.io.route('punch', function(req) {
    req.io.broadcast('punch', {
        socketId: req.io.socket.id
    });
});
app.io.route('doGuard', function(req) {
    req.io.broadcast('doGuard', {
        socketId: req.io.socket.id
    });
});
app.io.route('releaseGuard', function(req) {
    req.io.broadcast('releaseGuard', {
        socketId: req.io.socket.id
    });
});
app.io.route('updateHP', function(req) {
    req.io.broadcast('updateHP', {
        hp: req.data,
        socketId: req.io.socket.id
    });
});

app.io.route('lose', function(req) {
    app.io.broadcast('gameEnd', {
        loserId: req.io.socket.id
    });
});

app.io.route('sendResultImage', function(req) {
    app.io.broadcast('sendResultImage', {
        socketId: req.io.socket.id,
        image: req.data
    });
});

app.io.route('getImageBase64', function(req) {
    var url = req.data;
    request.get({
        url: url,
        encoding: null
    }, function(err, res, image) {
        if (err) {
            console.log(err);
            return;
        } else if (!image) {
            return;
        }

        req.io.emit('setImageBase64', 'data:image/png;base64,' + image.toString('base64'));
    });
});

app.listen(3000);

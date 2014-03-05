var path = require('path'),
    express = require('express.io');
module.exports = function() {
    var app = this;
    app.set('port', process.env.PORT || 3000);
    // app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'secret'
    }));

    // is it required for Aviary editor...?
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        next();
    });
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'UI')));

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }
};

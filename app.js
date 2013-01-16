
/**
 * Module dependencies.
 */

var express = require('express')
  , routes	= require('./routes')
  , blackJack = require('./routes/black_jack') // ブラックジャックコントローラー
  , http = require('http')
  , path = require('path');

// ejsのヘルパー登録
var helpers = require('express-helpers')(app);
// explessのインスタンス
var app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname + '/public')));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


app.listen(3000);

// Socket.ioの準備
var io = require('socket.io').listen(app);

app.set('io', io);

//Routes
console.log("APPSIDE+++++++++==================+++++++++++++++++");
console.log(io);
console.log("+++++++++==================+++++++++++++++++");


app.get('/', blackJack.black_jack);
//app.get('/', routes.index);
//app.get('/black_jack', blackJack.black_jack); // TODO: 自動的にコントローラーを読み込む事は出来なかったか？


//http.createServer(app).listen(app.get('port'), function(){
//  console.log("Express server listening on port " + app.get('port'));
//});
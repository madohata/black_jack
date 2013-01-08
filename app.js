
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
var app = express.createServer();

app.configure(function(){

  //app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// 開くポートを指定する
app.listen(3000);

app.get('/black_jack', blackJack.black_jack); // TODO: 自動的にコントローラーを読み込む事は出来なかったか？
app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

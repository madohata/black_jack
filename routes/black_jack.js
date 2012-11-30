
/**
 * ブラックジャック用コントローラー
 */

 exports.black_jack = function(req, res) {

	 // Socket.ioの準備
	 var app = require('express').createServer();
	 var io = require('socket.io').listen(app.listen(3001)) // TODO:とりあえず3001番としているが、何か根拠のあるポートに変更したい

	/**
	 * ユーザー情報の管理
	 */
	var UserList = require('../model/userList').UserList;
	var userList = new UserList();
	
	/**
	 * 通信イベントリスナ登録
	 */
	 io.sockets.on('connection', function(socket) {
	 	// 接続が成立したことをクライアントに通知
	 	socket.emit('connected');
	 	
	 	// サーバサイド　socketioイベントリスナ
	 	/**
	 	 * 接続が途切れた時のイベント
	 	 */
	 	 socket.on('disconnect', function() {
	 	 	
	 	 	// 接続が切れたことを全クライアントに通知
	 	 	io.sockets.emit('user_disconnected', {});
	 	 	// ユーザーリストからデータを削除
	 	 	userList.removeUserData(socket.id);
	 	 }
	 	 
	 	 /**
	 	  * ハンドシェイクが成功してユーザーがログインした時のイベント
	 	  */
	 	  socket.on('login', function(data) {
	 	  	// 他ユーザーのクライアントに
	 	  	
	 	  	// ユーザーリストにユーザーを登録
	 	  	userList.setUserData();
	 	  })
	 	 
 	// テンプレート表示
 	res.render('black_jack', { title: 'BlackJack'});
 };
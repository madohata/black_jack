
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


//app.listen(3000);

// Socket.ioの準備
var io = require('socket.io').listen(app.listen(3000));


//Routes
//console.log("APPSIDE+++++++++==================+++++++++++++++++");
//console.log(io);
//console.log("+++++++++==================+++++++++++++++++");

 // 最初に配られるチップの数
	 var INIT_CHIP = 100;

	/**
	 * ユーザー情報の管理
	 */
	var UserList = require('./model/userList').UserList;
	var userList = new UserList();

	/**
	 * トランプデータを作成
	 */
	var Cards = require('./model/cards').Cards;
	var cards = new Cards();
	cards.initialize(4); // 4組作成する
	cards.shuffleCards(); // カードをシャッフルする

	/**
	 * ディーラークラスを作成
	 */
	var Dealer = require('./model/dealer').Dealer;
	var dealer = new Dealer();

	/**
	 * ハンド管理クラスを作成
	 * ハンドリストはユーザーのIDと紐付けるユーザーはハンドIDのみを持つ
	 */
	var HandManager = require('./model/handManager').HandManager;
	var handManager = new HandManager(); // ユーザーデータの作成時に手札を追加し紐付ける

	/**
	 * 進行クラス
	 */
	// TODO: グローバルなフラグによる力技。timeoutの状態を確認する方法がわからん・・・
	var timeKeeperFlag = false;
	var TimeKeeper = function() {
		// 実行する処理の配列
		this.eventList = new Array();
		// 登録した時刻
		this.registDate;
		// ディールイベントを開始する
		this.eventList["DealEvent"] = function() {

			// ウェイトリスト削除確認
			timeKeeperFlag = false;
			console.log(timeKeeperFlag+"DEEEEERRRRRR!!!!!RESSSEEEEEEEETTTTTTT");

			// タイムアウトになった場合、チップをかけてないユーザーは自動で最大10枚賭ける
			for(var i in userList.getUserDataAll()) {
				if(userList.getUserData(i).betchip == 0) {
					userList.betChip(i, 10);
				}
			}

	 		// ディール処理を実行する
			deal();


		}
		// 手番を一つ進める
		this.eventList["ProgressEvent"] = function() {

			// ウェイトリスト削除確認
			timeKeeperFlag = false;

			// タイムアウトになった場合、ヒットを選んでいないユーザーは強制的にスタンドする
			for(var i in userList.getUserDataAll()) {
				if(handManager.canHit(i)) {
					handManager.setStand(i);

					var countNumber = userList.getUserData(i).countNumber;
			 		io.sockets.emit("stand_announce", {countNumber: countNumber});

			 		if(handManager.canNotHitAll()) {
			 			dealerTurn();
			 		 }
				}

				console.log(timeKeeperFlag+"PROOOOOOGRESSSSSSS!!!!!RESSSEEEEEEEETTTTTTT");
			}

		}

		// タイマー変数のリスト
		this.waitingList = new Array();

		// 時間を指定して自動進行させる
		this.registEvent = function(eventName, time) {

			console.log(timeKeeperFlag+"EVENTTTTTTTTTTTTT!!!!SEEEEEEEETTTTTTTSTARARARAARARAAAAARTTTTT!!!!!");
			// ウェイトリストにIDが登録されてなければ、イベント登録
			if(timeKeeperFlag == false) {
				// 既に登録されていた場合は古いものを消す
				this.cancelEvent(eventName);
				// 管理するために戻り値を登録しておく
				this.waitingList[eventName] = setTimeout( this.eventList[eventName], time);
				timeKeeperFlag = true;

				// 登録した時刻を記録
				this.registDate = new Date();
				console.log(timeKeeperFlag+"EVENTTTTTTTTTTTTT!!!!SEEEEEEEETTTTTTT");

			}

			// 登録されている時刻から数え残り時間を算出
			nowDate = new Date();
			// 登録時刻からの経過時間
			elapsedTime = nowDate.getTime()- this.registDate.getTime();
			// 残り時間の算出
			remainingTime = time - elapsedTime;

			return remainingTime;
		}

		// 登録しているタイマーをキャンセルして、即刻実行する
		this.runItNow = function (eventName) {
			// タイマーが登録されていれば解除
			this.cancelEvent(eventName);
			// イベントを実行
			this.eventList[eventName]();
		}

		// イベントをキャンセルする
		this.cancelEvent = function(eventName) {
			// 同じ名前のイベントでよばれた場合はタイマーを一旦消して再登録
			if(this.waitingList[eventName]) {
				clearTimeout(this.waitingList[eventName]);
			}
		}
	}
	var timeKeeper = new TimeKeeper();

	/**
	 * "ゲーム中を表すフラグ"これがtrueの場合はユーザーを参加させない
	 */
	var isOngoing = false;
	/**
	 * "プレイヤー満員"を表すフラグこれがtrueの場合はユーザーを増やさない
	 */

	// 現在観客に公開されているカードデータを送信する関数
	var getOpenHand = function() {
		// 現在場に公開されているカードを送信
 		var openHand = new Array();
		for( var i in userList.getUserDataAll() ) {
			var countNumber			= userList.getUserData(i).countNumber; // クライアント側に公開する数値ID
			openHand[countNumber]	= handManager.getCardList(i);	// 全員の公開札
		}
		var dealerHand = dealer.getHand();

		// もし試合中であるなら、2枚目のカードは非公開とする
//		if(isOngoing) {
//			for( var i in openHand ) {
//				openHand[i][1].suit   = 0;
//				openHand[i][1].number = 1;
//				openHand[i][1].isHold = true;
//			}
			dealerHand[1].suit   = 0;
			dealerHand[1].number = 0;
			dealerHand[1].isHold = true;
//		}

		return {openHand:openHand, dealerHand:dealerHand};


	}

	/**
	 * 通信イベントリスナ登録
	 */
	 //io.sockets.on('connection', function(socket) {
	 io.sockets.on('connection', function(socket) {
	 	// 接続が成立したことをクライアントに通知
	 	socket.emit('connected');

	 	// サーバサイド　socketioイベントリスナ
	 	/**
	 	 * 接続が途切れた時のイベント
	 	 */
	 	socket.on('disconnect', function() {
	 		// ■定義されてない場合は無視---------------------------------------
	 		if(userList.getUserData(socket.id)) {

		 		 console.log("プレイヤーが切断 : "+userList.getUserData(socket.id).nickname);

		 	 	// 接続が切れたことを全クライアントに通知
		 	 	io.sockets.emit('user_disconnected', userList.getUserData(socket.id));
		 	 	// ユーザーリストからデータを削除
		 	 	userList.removeUserData(socket.id);
		 	 	// 手札リストからデータを削除
		 	 	handManager.deleteHand(socket.id);

		 	 	// TODO:ユーザーが抜けた場合、進行不能とならないようあらゆるケースの対策をとる
		 	 	// もしユーザーが0になってしまったら、進行中フラグをfalseに戻しておく
		 	 	if(userList.getUserNum() == 0) {
		 	 		isOngoing = false;
		 	 	}
		 	 	// 全員がHITできない状態ならそのまま勝負を実行する
		 		 if(handManager.canNotHitAll()) {
		 			 judge();
		 		 }
	 		} else {
	 			// 観戦者の削除、観戦者リストに登録されてない場合は特に動作なし
	 			userList.deleteWatcher(socket.id);
	 		}
	 	 });

	 	 /**
	 	  * ハンドシェイクが成功してユーザーがログインした時のイベント
	 	  */
	 	 socket.on('login', function(data) {

			 // 登録前に既にログインしていたすべてのユーザーの情報を知らせる
			 socket.emit('get_login_user_data', {userList: userList.getUserDataAllForClient()});

	 		// ■席が空いてない場合はログインできない------------------------------
			 // あと、ゲーム進行中も登録できない

			 // TODO: 緊急措置
			 // ゲーム進行中の場合途中参加不可
			 	// TODO:誰も入っていないのにゲームが進行中となっていた場合の処理をこの"login"イベントの最初に追加する？
			 	var nameStr = "";
				var num = 0;
				for(var i in userList.getUserDataAll()) {
					nameStr += userList.getUserData(i).nickname;
					nameStr += " : ";
					console.log("入室中ID"+i);
					num++;
				}
				if(num == 0) {
					isOngoing = false;
				}

	 		if(userList.isEmptySeat() && isOngoing == false) {
			 	// ユーザーリストにユーザーを登録
		 	  	userList.setUserData(socket.id, data.nickname, INIT_CHIP);
		 	  	console.log("かね！！"+userList.getUserData(socket.id).chip+"=====================================");
		 	  	console.log("ユーザーを登録- : "+data.nickname+" : "+socket.id+"--------------------------------------------------")
		 	  	// 手札リストにユーザーの手札を追加
		 	  	handManager.createHand(socket.id);
		 	  	var myAccount = userList.getUserData(socket.id);
		 	  	// 他ユーザークライアントにアカウント情報を知らせる

		 	  	socket.broadcast.emit('login_announce_other', myAccount);
		 	  	// 自分のクライアントにアカウント情報を知らせる
		 	  	socket.emit('login_announce_myself', myAccount);

		 	  	// ディール開始までのタイマーを登録
		 	  	remainingTime = timeKeeper.registEvent("DealEvent", 30000); // 30秒
		 	  	// ディール開始までの制限時間を送信
		 	  	io.sockets.emit('receive_standby_time_limit', {time:Math.floor(remainingTime/1000)});
		 	  	// デッキの状態をクライアントに送信
		 	  	socket.emit("receive_deck_data", {deckCardNum:cards.deck.length, deckNum: cards.deckNum});
	 		} else {
	 			// ■ゲームプレイヤーとして登録できなかった場合は観客として登録される------------------------------


			 	// TODO:５人を超えていた場合、勝負が既に進行中の場合は参加させない「観戦モード」にする
			 	if(! userList.isEmptySeat()) {
			 		console.log("テーブルに空きがないため参加不可+++++++++++++++================");
			 		socket.emit('alert_message', {message: "テーブルに空きがないため参加できません<br/>しばらくたってから更新してください"});
			 	}


			 	if(isOngoing && num != 0) {
			 		// TODO: メッセージをクライアントに表示させよう

			 		console.log("ゲーム進行中のため参加不可+++++++++++++++++++++++++++============================");
			 		socket.emit('alert_message', {message: "ゲーム進行中のため参加できません : "+nameStr+"がプレイ中 : 計"+num+"人 <br/>しばらくたってから更新してください"});
			 	}

			 	console.log("観客として登録++++++++++++++====================");

			 	// 現在のハンド状況を送信
			 	socket.emit('watch_mode_receive_deal_data', getOpenHand());
			 	socket.emit('watch_mode');

	 			// 観客として登録
	 			userList.setWatcherData(socket.id, data.nickname);
	 			// クライアントに観客として登録されたことを報告
	 			socket.emit('login_announce_myself_watcher', {nickname: data.nickname, watcherNumber: userList.getWatcherNum()});
	 			// 他ユーザーのクライアントに観客として登録されたことを報告
	 			socket.broadcast.emit('login_announce_other_watcher', {nickname: data.nickname});
	 		}
	 	  });

	 	 /**
	 	  * ユーザーが準備完了信号を受け取るイベント
	 	  */
	 	 socket.on('standby', function(data) {
	 		 // ■ゲーム進行中に受け取った場合は無視 ユーザーデータが無い場合もイベントは起こさない----------------------------------------
	 		 if(isOngoing == false &&  userList.getUserData(socket.id)) {
		 		 // ユーザーのスタンバイフラグをtrueにする
		 		 userList.setStandby(socket.id);
		 		 // 賭け金をチェック
		 		 var betChip = Number(data.betChip);
		 		 betChip = Math.floor(betChip); // 小数点切り捨て
		 		 if(betChip) {
		 			 if(betChip < 10) {
		 				betChip = 10;
		 			 }
		 		 } else {
		 			 betChip = 10;
		 		 }
		 		 // ユーザーのこのゲームでの賭け金を記録
		 		 // TODO:オールインの場合の表示を追加する？
		 		 betChip = userList.betChip(socket.id, betChip);
		 		 // 他ユーザーにスタンバイ状態になったことを知らせる
		 		 socket.broadcast.emit('standby_announce', {countNumber: userList.getUserData(socket.id).countNumber,
		 			 betChip: betChip});
		 		 // 自分のクライアントに正しくベット出来たことを知らせる
		 		socket.emit('myAccount_standby_announce', {betChip: betChip});

		 		 // 全てのユーザーが準備完了となったか
		 		 if (userList.allUsersIsStandby()) {
		 			 // ディールステートへ遷移する
		 			 timeKeeper.runItNow('DealEvent');
		 		 }
	 		 }
	 		 // ■ゲーム進行中に受け取った場合は無視----------------------------------------
	 	 });

	 	 /**
	 	  * HIT要求を受ける
	 	  */
	 	 socket.on('hit_order', function(data) {
	 		 // ■受け取るのはゲーム進行中のみ----------------------------------------
	 		 if(isOngoing == true) {
		 		 // プレイヤーがヒットできる状態かデータチェック
		 		 if(handManager.canHit(socket.id)) {
		 			 console.log("カードを一枚配る--------------------------------------");
		 			 // カードを一枚追加
		 			var card = cards.drawCard();
		 			 handManager.hitCard( socket.id, card );

		 	 		// この追加でバーストしていないかチェック
		 			var isBurst = handManager.isBurst(socket.id);
		 			var sum = handManager.calcHand(socket.id);
		 	 		// 結果をクライアントに送信
		 	 		socket.emit('receive_hit_data', {card: card, isBurst: isBurst, sum: sum});
		 	 		var countNumber = userList.getUserData(socket.id).countNumber;
		 	 		socket.broadcast.emit('receive_other_hit_data',{countNumber:countNumber, card: card});
		 		 }

		 		// デッキの状態を全員に送信
		 		io.sockets.emit("receive_deck_data", {deckCardNum:cards.deck.length, deckNum: cards.deckNum});

		 		// 全員の選択が終わっていたら
		 		 if(handManager.canNotHitAll()) {

		 		 	// 進行管理者に設定されている進行イベントをキャンセル
		 		 	timeKeeper.cancelEvent('ProgressEvent');
		 			// ディーラーの判断をする
		 			dealerTurn();
		 		 }
	 		 }
	 		 // ■受け取るのはゲーム進行中のみ----------------------------------------
	 	 });

	 	 /**
	 	  * STAND要求を受ける
	 	  */
	 	 socket.on('stand_order', function(data) {
	 		 // ■受け取るのはゲーム進行中のみ----------------------------------------
	 		if(isOngoing == true) {
		 		 // プレイヤーをスタンド状態に
		 		 console.log("-------------------------------STAND要求を受けた");
		 		 handManager.setStand(socket.id);

		 		 // 全員（自分も含め）スタンド状態になっていることを知らせる
		 		 var countNumber = userList.getUserData(socket.id).countNumber;
		 		 io.sockets.emit("stand_announce", {countNumber: countNumber});

		 		 //
		 		 if(handManager.canNotHitAll()) {

		 		 	// 進行管	設定されている進行イベントをキャンセル
		 		 	timeKeeper.cancelEvent('ProgressEvent');
		 			dealerTurn();
		 		 }
		 	}
	 		// ■受け取るのはゲーム進行中のみ----------------------------------------
	 	 });

	 	 /**
	 	  * メッセージを送信する
	 	  */
	 	var msgLog = new Array();
		socket.on('chat_message', function(data) {
			// logging
			msgLog.unshift(data);
			if(msgLog.length > 10)
			{
			   while(msgLog.length > 10)
			   {
			        msgLog.pop();
			   }
			}
			console.log(msgLog);

			// プレイヤーか観客のニックネームを付与、なければニックネームなし
			data.nickname = "";
			if(userList.getUserData(socket.id)) {
				data.nickname = userList.getUserData(socket.id).nickname;
			} else {
				var watcherList = userList.getWatcherList();
				for(var i in watcherList ) {
					if(watcherList[i].socketId == socket.id) {
						data.nickname = watcherList[i].nickname;
						break;
					}
				}
			}

			// for all: io.sockets.emit()
			io.sockets.emit('chat_message', data);
		});

	 	 // TODO: デバッグイベント
//		 	var debugReceive = function () {
//		 		 io.sockets.emit("debug_receive", {message: "デバッグレシーブ",userList:userList.getUserDataAllForClient()});
//		 	}
//		 	var loopname = setInterval(debugReceive, 3000);

	 	// データ詳細を表示させる関数
	 	var showFunc = function (data) {
	 		for (var i in data) {
	 			console.log("index is :"+i);
	 			console.log("index type of"+(typeof i));
	 			console.log("value of :"+data[i]);
	 			console.log("value type of"+(typeof data[i]));
	 			if( typeof data[i] == "string"){break};
	 			showFunc(data[i]);
	 		}
	 	}
	 });

	/**
	 * ディールする関数
	 */
	var deal = function() {

		// ゲーム進行中
		isOngoing = true;


		// 全員スタンバイ状態であることの確認が取れたのでスタンバイフラグをリセット
		userList.resetAllStanbyFlag();
		// カードの配分実行
		for(var i=0; i<2; i++) {
			dealer.pushCard(cards.drawCard());
			for( var t in userList.getUserDataAll() ) {
				handManager.pushCard(t, cards.drawCard());
			}
		}

		 // 各クライアントに必要な情報を送信
		var dealerHand = dealer.getHand()[0];		// ディーラーの公開札
		console.log("+++++++++show func dealerhand+++++++++++++++++++++++++++++");
		for(var i in dealer.getHand()) {
			console.log("i : "+i);
			console.log("hand[i] : "+dealer.hand[i]);
		}
		var openHand = new Array();
		for( var i in userList.getUserDataAll() ) {
			var countNumber			= userList.getUserData(i).countNumber; // クライアント側に公開する数値ID
			openHand[countNumber]	= handManager.getCardList(i);	// 全員の公開札

		}


		var isAllUserHandComplete = true;
		for(var i in userList.getUserDataAll()) {
			var mineHand = handManager.getCardList(i); // 自分の手札
			var canHit = handManager.canHit(i);	// HIT可能かどうか
			var isBlackJack = handManager.isBlackJack(i)
			io.sockets.socket(i).emit('receive_deal_data', {openHand:openHand, dealerHand:dealerHand, mineHand:mineHand, canHit: canHit, sumValue : handManager.calcHand(i), isBlackJack: isBlackJack});
			// Hit出来るユーザーには選択肢を提示
			console.log("+++++++++canhit判定+++++++++++++++++++++++");
			if(canHit) {
				io.sockets.socket(i).emit('hit_or_stand');
				isAllUserHandComplete = false;
			}
		}

		// 1人でもヒット可能ならタイマーを設定する
		if(isAllUserHandComplete == false) {
			// 1ターン制限時間までのタイマーを登録
			timeKeeper.registEvent("ProgressEvent", 30000); // 30秒
		 	// 1ターン制限時間までの制限時間を送信
			io.sockets.emit('receive_hit_or_stand_time_limit', {time:30});
		}

		// 観戦中のユーザーへハンドデータを送信する
		var data = getOpenHand();
		var watcherList = userList.getWatcherList();
	 	for(var i in watcherList) {
	 		io.sockets.socket(watcherList[i].socketId).emit('watch_mode_receive_deal_data', data);
	 	}
	}
	/**
	 * ディーラーの判断
	 */
	var dealerTurn = function() {
		console.log("ディーラーは作業を開始する-----------------------------");

		console.log("テスト：ディーラーの手札を表示する-----------------------------");
		var tempHand = dealer.getHand();
		for(var i in tempHand) {
			console.log("インデックス:"+i);
			console.log("suit:"+tempHand[i].suitStr+"number:"+tempHand[i].number);
		}

		if(dealer.willHit()) {
			var card = cards.drawCard();
			dealer.pushCard( card );
			console.log("ディーラーは一枚引く---------------"+card.suitStr+"の"+card.number+"--------------");
			io.sockets.emit('receive_dealer_action', {card:card});
			// デッキの状態を送信
			io.sockets.emit("receive_deck_data", {deckCardNum:cards.deck.length, deckNum: cards.deckNum});
		}

		// 全員最終形か調べる
		// ヒットのロックを解除
		handManager.AllHitFlagReset();

		// すべてのユーザーの手は完成しているか？
		var isAllUserHandComplete = true;
		// まだ手役が完成していないユーザーがいれば再度質問を投げかける
		for(var i in userList.getUserDataAll()) {
			if( ! handManager.isStanding(i) ) {
				io.sockets.socket(i).emit('hit_or_stand');
				console.log("ディーラー"+i+"に質問を投げかける-----------------------------");

				// まだすべてのユーザーの手は完成していない
				isAllUserHandComplete = false;
			}
		}

		// もし、質問を投げかけるべきユーザーが一人もいなければ
		if(isAllUserHandComplete) {
			// 自らが引かなければならない枚数をすべて引いて
			while(dealer.willHit()) {
				var card = cards.drawCard();
				dealer.pushCard( card );

				io.sockets.emit('receive_dealer_action', {card:card});
				console.log("ディーラー連続してカードを引く-----------------------------");
			}
			// デッキの状態を送信
			io.sockets.emit("receive_deck_data", {deckCardNum:cards.deck.length, deckNum: cards.deckNum});
			console.log("ディーラーは点数計算に移行する-----------------------------");
			// 勝負に移す
			judge();
		} else {
			  // 1ターン制限時間までのタイマーを登録
		 	  timeKeeper.registEvent("ProgressEvent", 30000); // 30秒
		 	  // 1ターン制限時間までの制限時間を送信
		 	  io.sockets.emit('receive_hit_or_stand_time_limit', {time:30});
		}

		// まだ手札が完成していないユーザーがいたら再度応答を待つ
	}
	/**
	 * 勝負を行う関数
	 */
	var judge = function() {
		console.log("-ジャッジスタート-------------------------------------------");

		var dealerValue = dealer.calcHand();
		var resultList  = new Array();

		// ディーラーがバーストしているか
		if(dealer.isBurst()) {
			dealerValue = 0;
		}

		// ディーラーの伏せカード
		var dealerHoldCardData = dealer.getHoldCardData();

		// 各プレイヤーのホールドカード
		var otherHoldCards = new Array();
		for(var i in userList.getUserDataAll()) {
			var countNumber = userList.getUserData(i).countNumber;
			otherHoldCards[ countNumber ] = handManager.getHoldCardData(i);
			console.log(otherHoldCards[ countNumber ]+"++++++++++++++++===========++++++++++++++++++++++++test1");
		}
		console.log(otherHoldCards+"++++++++++++++++===========++++++++++++++++++++++++test2");

		// ディーラーの手と各プレイヤーの合計値を比較
		for (var i in userList.getUserDataAll()) {
			var userValue	= handManager.calcHand(i);
			var userData	= userList.getUserData(i);
			var countNumber	= userData.countNumber;
			resultList[countNumber] = new Array();

			// ユーザーがバーストしているか
			if(handManager.isBurst(i)) {
				userValue = 0;
			}

			if(userValue > dealerValue) {
				// 勝ち
				message = "勝ちました"+" : ディーラー="+dealerValue+"あなた="+userValue;
				// もしブラックジャックなら 2.5倍を払う
				var payout;
				if( handManager.isBlackJack(i) ) {
					payout = userData.betChip * 2.5;
				} else {
					payout = userData.betChip * 2;
				}

				message += "</br>払い戻し: "+ payout;
				userList.refund(i, payout);

			} else if(userValue < dealerValue || userValue == 0){
				// 負け
				message = "負けました : ディーラー="+dealerValue+"あなた="+userValue;
				message += "</br>払い戻し: なし";
				userList.refund(i, 0);
			} else {
				console.log(userData.betChip+"+++++++=========チップ確認");
				message = "引き分けです : ディーラー="+dealerValue+"あなた="+userValue;
				message += "</br>払い戻し: "+ userData.betChip;
				userList.refund(i, userData.betChip);
			}

			// 勝負の結果をクライアントに送信
			io.sockets.socket(i).emit('receive_judge_result', {message:message, dealerHoldCard: dealerHoldCardData, testNowtChip: userData.chip, otherHoldCards: otherHoldCards});

			// 次のディールまでの待ち時間を登録
			// ディール開始までのタイマーを登録
	 	  	remainingTime = timeKeeper.registEvent("DealEvent", 30000); // 30秒
	 	  	// ディール開始までの制限時間を送信
	 	  	io.sockets.emit('receive_standby_time_limit', {time:Math.floor(remainingTime/1000)});
		}

		/**
		 * 観客用の結果送信イベント
		 */
		var watcherList = userList.getWatcherList();
		for(var i in watcherList) {
			io.sockets.socket( watcherList[i].socketId ).emit('receive_result_for_watcher', {dealerHoldCard: dealerHoldCardData, otherHoldCards: otherHoldCards});
		}

		/**
		 * ゲーム終了。スタンバイフェーズに移行するための初期化処理を行う
		 */
		// ハンドマネージャーを初期化
		handManager.handReset();

		// ディーラーハンドを初期化
		dealer.deleteHand();

		// ワンゲーム終了
		isOngoing = false;
	}

app.get('/', blackJack.black_jack);
//app.get('/', routes.index);
//app.get('/black_jack', blackJack.black_jack); // TODO: 自動的にコントローラーを読み込む事は出来なかったか？


//http.createServer(app).listen(app.get('port'), function(){
//  console.log("Express server listening on port " + app.get('port'));
//});
/**
 * Enchant.js
 */
enchant();

/**
 * ウィンドウが読み込まれたとき
 */
window.onload = function() {
	// ゲーム画面
	var game = Game(512, 512); // initializeで引数がundefineになってしまう原因を探る
	// FPS
	game.fps = 30;
	// シーンの設定
	game.rootScene.backgroundColor = 'green';

	// ログを表示するラベル
	var logLabel = new Label("");
	logLabel.font = "10 px Tahoma";
	logLabel.color  ="white";
	logLabel.x = 20;
	logLabel.y = 5;
	game.rootScene.addChild(logLabel);

	// デッキを表示するオブジェクト
	var deckUI = new Object;
	deckUI.deckNumLabel			= new Label("投入されているデッキの数");
	deckUI.deckNumLabel.x		= 10;
	deckUI.deckNumLabel.y		= 10;
	deckUI.deckNumLabel.color	="white";
	deckUI.deckNumLabel.font	= "10 px Tahoma";
	game.rootScene.addChild(deckUI.deckNumLabel);
	deckUI.deckCardNumLabel	= new Label("デッキ　残り枚数枚数");
	deckUI.deckCardNumLabel.x = 10
	deckUI.deckCardNumLabel.y = 20;
	deckUI.deckCardNumLabel.color	="white";
	deckUI.deckCardNumLabel.font	= "10 px Tahoma";
	game.rootScene.addChild(deckUI.deckCardNumLabel);

	// 画像パスを保存する
	var imagePass = {
		noImage			: 'images/noimage.gif',
		betButton		: 'images/button_bet.gif',
		hitButton		: 'images/button_hit.gif',
		standButton		: 'images/button_stand.gif',
		resultButton	: 'images/button_result.gif',
		trump			: 'images/trump.png',
		trumpFaceDown	: 'images/trump_face_down.jpg',
		sheet			: 'images/sheet.png'
	}
	game.preload(imagePass['noImage']);	// 読み込ませる
	game.preload(imagePass['betButton']);
	game.preload(imagePass['hitButton']);
	game.preload(imagePass['standButton']);
	game.preload(imagePass['resultButton']);
	game.preload(imagePass['trump']);	// トランプ画像
	game.preload(imagePass['trumpFaceDown']);	// トランプ画像
	game.preload(imagePass['sheet']);

	var getImage = function(name) {
		return game.assets[ imagePass[name] ];
	}

	// ソケット接続
	var socket = io.connect('http://madohata.c.node-ninja.com:3000/');
	// ソケット接続に成功した場合のイベントリスナ
	socket.on('connect', function() {
		addLog("接続できた！");

		socket.emit('login',  {'nickname': prompt("あなたのニックネームを　入力してください")});
	});
	/**
	 * ゲームの必要データが読み込まれたとき発生するイベント
	 */
	game.onload = function() {

		// 他プレイヤーのデータリスト
		var otherList = new Array();
		// 自分のプレイヤーのポインタを保存
		var myAccount;
		// ステートマネージャー
		stateManager = new StateManager();
		// ディーラーの手札 カードオブジェクトを登録しておくための型
		var dealerHand = new DealerHand();

		/**
		 * 自分がログインに成功した時のアナウンス
		 */
		socket.on('login_announce_myself' , function(data) {
			addLog("あなたの登録データ 名前："+data.nickname+"チップ"+data.chip+"番号"+data.countNumber);
			myAccount = new PlayerUnit(data.countNumber, data.nickname, data.chip);

		});
		/**
		 * 他人がログインに成功した時
		 */
		socket.on('login_announce_other' , function(data) {
			addLog("ユーザー"+data.nickname+"さんが入場しました　チップ数："+data.chip+"番号"+data.countNumber);
			otherList[data.countNumber] = new PlayerUnit(data.countNumber, data.nickname, data.chip);
		});
		/**
		 * 自分がログインする前に既に入っていたユーザーを登録
		 */
		socket.on('get_login_user_data' , function(data) {
			for(var i in data.userList) {
				addLog("参加中のメンバー"+data.userList[i].nickname+"がプレイ中、チップ数："+data.userList[i].chip+"番号"+data.userList[i].countNumber);
				otherList[data.userList[i].countNumber] = new PlayerUnit(data.userList[i].countNumber, data.userList[i].nickname, data.userList[i].chip);
			}
		});
		/**
		 * 他のユーザーが接続を解除した場合のイベントリスナ
		 */
		socket.on('user_disconnected', function(data) {
			addLog(data.nickname + "さんが抜けました。");
			if (data.countNumber in otherList) {
				// ユーザーに登録されている表示物を削除
				otherList[data.countNumber].deleteChild();
				// 他ユーザーリストから要素を削除
				delete otherList[data.countNumber];
				console.log("ログアウトしたユーザを削除");
			}
		});

		/** スタンバイステート *************************************************************/
		/**
		 * アラートメッセージを表示するイベントリスナ
		 */
		socket.on('alert_message', function(data) {

			window.alert(data.message);

		});
		/**
		 * スタンバイステートに必要な情報を受け取るリスナ
		 */
		socket.on('standby_announce', function(data) {

			addLog(otherList[data.countNumber].nickname+"さんが準備を完了しました。ベット額は"+data.betChip+"です");

		});
		/** ディールステート *************************************************************/
		/**
		 * ディールデータ受け取るイベントリスナ
		 */
		socket.on('receive_deal_data', function(data) {
			stateManager.changeState('Deal');

			// 結果画面　→　ディールステート、と直接移動する事があるので、手札情報を初期化
			// ユーザーユニットのハンドを初期化
			myAccount.deleteChild();
			for(var i in otherList) {
				otherList[i].deleteChild();
			}

			// ディーラーのハンドを初期化
			dealerHand.reset();

			// 背景となるシートを追加
			// TODO:ゲームの表示座標がおかしい。座標を決めるシステムを作るべき
			var sheet = new enchant.Sprite(512,512);
			sheet.image = getImage('sheet');
			sheet.x=0;
			sheet.y=0;
			stateManager.addChild("sheet", sheet);

			for (var i in data.openHand) {
				if(i != myAccount.countNumber && data.openHand[i]) {
					console.log(i);
					addLog(otherList[i].nickname+"のカードは"+data.openHand[i].suitStr+"の"+data.openHand[i].number+"と伏せカード1枚");
				}
			}
			addLog("カードを引きますか？この手で勝負しますか？");


			//***********************************************:
			// トランプを表示させてみる TODO: トランプの配置は場の「シート」に合わせて定義する
			// ディーラートランプ
			// オープンカード
			dealerHand.setDealCard(data.dealerHand.suit, data.dealerHand.number);
			// 伏せカード
			dealerHand.setHoldCard();

			// ユーザーの手札を表示
			for (var i in data.openHand) {
				if(i != myAccount.countNumber && data.openHand[i]) {
					// 一枚目
					otherList[i].addCard(data.openHand[i].suit, data.openHand[i].number, false);

					// 二枚目
					otherList[i].addCard(0, 0, true);



					// 基本ステータスの表示
					otherList[i].addStatusLabel();

				} else if(i == myAccount.countNumber) {
					// ユーザーユニットに登録
					myAccount.addCard(data.mineHand[0].suit, data.mineHand[0].number, false);
					myAccount.addCard(data.mineHand[1].suit, data.mineHand[1].number, false);

					myAccount.addStatusLabel();
					myAccount.updateStatusLabel({cardValue : data.sumValue});

					if(data.isBlackJack) {
						myAccount.updateStatusLabel({cardValue : "Black Jack!<br/> 払戻金が2倍になります！"});
					}
				}
			}
		});

		/**
		 * ヒットした結果を受け取る
		 */
		socket.on('receive_hit_data', function(data) {
			// 追加されたカードを描画する
			// TODO:席をクライアント側で登録する
			addLog("カードを受け取りました。 : "+data.card.suitStr+"の"+data.card.number);
			addLog("合計"+data.sum+"です");
			otherList[i].updateStatusLabel({cardValue : data.sum});
			if(data.isBurst) {
				addLog("バーストしました！");
				myAccount.addBurstIcon();
			}

			// ユーザーユニットに登録
			myAccount.addCard(data.card.suit, data.card.number, false);
		});
		/**
		 * 他者がヒットした結果を受け取る
		 */
		socket.on('receive_other_hit_data', function(data) {
			// 追加されたカードを描画する
			otherList[data.countNumber].addCard(data.card.suit, data.card.number, false);
		});
		/**
		 * 誰かがスタンドしたことを知らせる
		 */
		socket.on('stand_announce', function(data) {
			if(myAccount.countNumber == data.countNumber) {
				myAccount.addStandIcon();

				stateManager.removeChild('hitButton');
				stateManager.removeChild('standButton');
			} else {
				otherList[data.countNumber].addStandIcon();
			}
		});
		/**
		 * 勝敗の計算結果を受け取る
		 */
		socket.on('receive_judge_result', function(data) {
			console.log("+++++++++++++++ここで勝敗結果を受け取る+++++++++++++++");


			var label = new Label("<b>"+data.message+"</b>");
			label.x = 100;
			label.y = 100;
			label.color = "Black";
			stateManager.addChild("resultMessage", label);

			// ディーラーのホールドカードを公開
			dealerHand.openHoldCard(data.dealerHoldCard.suit, data.dealerHoldCard.number);

			// チップを表示
			console.log("現在のあなたのチップは"+data.testNowtChip+"です");
			var buf = '<span style="color: #00F"> announce :</span> ';
			buf += "現在のあなたのチップは"+data.testNowtChip+"です" + '<br/>';
			$("#console").html(buf + $("#console").html());

			// ボタン
			resultButton = new ResultButton(game.width/2+50, 150);
			resultButton.addEventListener('touchend', function() {
				// ユーザーユニットのハンドを初期化
				myAccount.deleteChild();
				for(var i in otherList) {
					otherList[i].deleteChild();
				}

				// ディーラーのハンドを初期化
				dealerHand.reset();

				stateManager.changeState("Standby");
			});
			stateManager.addChild("resultButton", resultButton);

		});
		/**
		 * ディール開始までの制限時間を受け取る
		 */
		socket.on('receive_standby_time_limit', function(data) {
			console.log("test");
			var label = new Label("<b>ゲーム開始まで"+data.time+"秒</b>");
			label.x = 100;
			label.y = 120;
			label.color = "Black";
			label.timer = data.time;
			label.addEventListener('enterframe', function() {
				if(game.frame%game.fps == 0) {
					this.timer--;
					this.text = "<b>ゲーム開始まで"+this.timer+"秒</b>"
				}
			});

			stateManager.addChild("standbyTimeLimitLabel", label);
		});

		/**
		 * デッキの状態を受け取る
		 */
		socket.on('receive_deck_data', function(data) {
			// デッキの数を更新
			deckUI.deckNumLabel.text		= "投入デック数 : "+data.deckNum;
			// デッキの枚数を更新
			deckUI.deckCardNumLabel.text	= "残り"+data.deckCardNum+"枚";
			// TODO:シャッフルしたらアイコンを表示？
		});

		/**
		 * TODO:デバッグレシーブ（実験）
		 */
//		socket.on('debug_receive', function(data) {
//			console.log("デバッグレシーブ : "+data.message);
//			showFunc(data.userList);
//		});
		/**
		 * ディーラーのHitStand情報を受け取る
		 */
		socket.on('receive_dealer_action', function(data) {
			console.log("ディーラーがカードをヒット");
			dealerHand.addCard(data.card.suit, data.card.number);
		});
		/**
		 * Hit Standを選択するボタンを生成する
		 */
		socket.on('hit_or_stand', function(data) {
			console.log("HIT STAND ボタンの生成要請を受ける");
			// hitButton
			hitButton = new HitButton(game.width/2+50, 150);
			hitButton.addEventListener('touchend', function() {
				// サーバーのHITイベントを呼ぶ
				console.log("---------------------------------hit_orderを呼ぶ");
				socket.emit('hit_order');
				console.log("HITボタンのエンド処理================================ : ");
				stateManager.removeChild('hitButton');
				stateManager.removeChild('standButton');
			});
			stateManager.addChild("hitButton", hitButton);

			// standButton
			standButton = new StandButton(game.width/2-50, 150);
			standButton.addEventListener('touchend', function() {
				// サーバーのスタンドイベントを呼ぶ
				console.log("---------------------------------stand_orderを呼ぶ");
				socket.emit('stand_order');
				console.log("STANDボタンのエンド処理================================ : ");
				stateManager.removeChild('hitButton');
				stateManager.removeChild('standButton');
			});
			stateManager.addChild("standButton", standButton);
		});

		/**
		 * チャットメッセージを受け取る #console :IDの付いたDOMに送る
		 */
		socket.on('chat_message', function (data) {
			var buf = '<span style="color: #999">' + data.nickname + ':</span> ';
			buf += data.message + '<br/>';
			$("#console").html(buf + $("#console").html());
		});

		// ゲームメイン処理の開始　ゲーム開始
		game.rootScene.addEventListener(Event.ENTER_FRAME, enterFrameEvent);

	}

	// ゲームスタート
	game.start();

	/**
	 * 毎フレーム行う処理
	 */
	function enterFrameEvent() {
	}

	// ゲーム用ユーティリティ関数
	function addLog( message ) {
		// 最新のメッセージをログの先頭に付け加える
		//logLabel.text = message + "<br>" + logLabel.text;
		// TODO: n件以上は表示されないよう調整する
	}

	/**
	 *  プレイヤーのデータクラス
	 */
	var PlayerUnit = enchant.Class.create({
		initialize : function(countNumber, nickname, chip) {
			this.countNumber	= countNumber;
			this.nickname		= nickname;
			this.chip			= chip;
			this.cardList		= new Array();
			this.x				= countNumber*65;//game.width/6*(countNumber+1);
			this.y				= game.height*0.6;

			this.childArray = new Array(); // 描画物を格納しておく

			// ステータスラベルを作成
			this.addStatusLabel();
		},
		addCard : function(suit, number, faceDownFlag, cardValue) {
			cardNum = this.cardList.length;
			var card =  new Trump(this.x + cardNum%2 * 30, this.y + Math.floor(cardNum/2) * 40, suit, number);
			if(faceDownFlag) {
				// カードを裏返す
				card.faceDown();
			}
			this.cardList.push(card);
			// 描画物として追加
			this.addChild("userCard_"+cardNum, card);

			// カードの合計数
			cardValueLabel.text = cardValue;

		addStandIcon : function() {
			var label = new Label("<b>Stand!</b>");
			label.font = "16 px Tahoma";
			label.color = "white";
			label.x = this.x;
			label.y = this.y-30;
			this.addChild("standIcon", label);
		},
		addBurstIcon : function() {
			var label = new Label("<b>Burst!</b>");
			label.font = "20 px Tahoma";
			label.color = "orange";
			label.x = this.x;
			label.y = this.y-30;
			this.addChild("burstIcon", label);
		},
		addStatusLabel : function() {
			var nameLabel = new Label(this.nickname);
			nameLabel.font = "10 px Tahoma";
			nameLabel.color = "white";
			nameLabel.x = this.x;
			nameLabel.y = this.y-50;
			this.addChild("nameLabel", nameLabel);

			var chipLabel = new Label("チップ : "+this.chip);
			chipLabel.font = "10 px Tahoma";
			chipLabel.color = "white";
			chipLabel.x = this.x;
			chipLabel.y = this.y-40;
			this.addChild("chipLabel", chipLabel);

			var seatNumberLabel = new Label("席 : "+this.countNumber);
			seatNumberLabel.font = "10 px Tahoma";
			seatNumberLabel.color = "white";
			seatNumberLabel.x = this.x;
			seatNumberLabel.y = this.y-30;
			this.addChild("seatLabel", seatNumberLabel);

			var cardValueLabel = new Label("");
			cardValueLabel.font = "20px Tahoma";
			cardValueLabel.color = "white";
			cardValueLabel.x = this.x;
			cardValueLabel.y = this.y-700;
			this.addChild("cardValueLabel", cardValueLabel);
		},
		updateStatusLabel : function(data) {
			this.childArray["cardValueLabel"] = data.cardValue;
		},
		adjustCard : function() { // カードを定位置に置く //TODO:位置は仮実装
			rawNum	= 1;
			raw		= 0;
			column	= 0;
			for(var i in this.cardList) {
				this.cardList[i].x = this.x + raw * 30;
				this.cardList[i].y = this.y + column * 40;
				console.log("Seat Number : "+this.countNumber);
				console.log("card"+this.cardList[i].suitStr+"x : "+this.cardList[i].x);
				console.log("card"+this.cardList[i].number+"y : "+this.cardList[i].y);
				if(rawNum==raw) {raw=0; column++;} else{raw++;}
			}
		},
		addChild : function(name, childObject) {
			this.childArray[name] = childObject;
			// ルートシーンに描画登録
			game.rootScene.addChild(childObject);
		},
		deleteChild : function() { // 後始末
			for (var i in this.childArray) {
				game.rootScene.removeChild(this.childArray[i]);
			}

			this.childArray = new Array();
			this.cardList = new Array();
		}
	});

	/**
	 * ディーラーの手札
	 */
	var DealerHand = function() {
		this.handArray = new Array();
		this.holdCard;
		this.x = game.width/2
		this.y = game.height*0.1

		// dealState
		this.setDealCard = function(suit, number) {
			var card =  new Trump(this.x, this.y, suit, number);
			this.handArray.push(card);
			this.addChild(card); // カードを表示
		}
		// setHoldCard
		this.setHoldCard = function() {
			var card =  new Trump(this.x+30, this.y, 0, 0);
			// 裏返す
			card.faceDown();
			this.holdCard = card;
			this.handArray.push(card);
			this.addChild(card); // カードを表示
		}
		// addCard
		this.addCard = function(suit, number, faceDownFlag) {
			var card =  new Trump(this.x+this.handArray.length*30, this.y, suit, number);
			this.handArray.push(card);
			this.addChild(card); // カードを表示
		}
		// openHoldCard
		this.openHoldCard = function(suit, number) {
			this.holdCard.suit = suit;
			this.holdCard.number = number;
			this.holdCard.faceUp();
		}
		// reset
		this.reset = function() {
			// ルートシーンからすべての描画物を抹消
			for (var i in this.handArray) {
				game.rootScene.removeChild(this.handArray[i]);
			}
			// 配列と変数を初期化
			this.handArray = new Array();
			this.holdCard = null;
		}
		this.addChild = function(object) {
			game.rootScene.addChild(object);
		}
	}

	/**
	 * ボタンベースの定義
	 */
	var ButtonBase = enchant.Class.create(enchant.Sprite, {
		initialize : function(x, y, width, height) {
			enchant.Sprite.call(this, width, height);
			this.x = x;
			this.y = y;
			this.frame = 0;
			this.image = getImage('noImage');
		}
	});
	/**
	 * スタンバイボタン
	 */
	var StandbyButton = enchant.Class.create(ButtonBase, {
		initialize : function(x, y,  width, height) {
			ButtonBase.call(this, x-32, y-16, 64, 32);
			this.image = getImage('betButton');
		}
	});
	/**
	 * ヒットボタン
	 */
	var HitButton = enchant.Class.create(ButtonBase, {
		initialize : function(x, y, width, height) {
			ButtonBase.call(this, x-32, y-16, 64, 32);
			this.image = getImage('hitButton');
		}
	});
	/**
	 * スタンドボタン
	 */
	var StandButton = enchant.Class.create(ButtonBase, {
		initialize : function(x, y, width, height) {
			ButtonBase.call(this, x-32, y-16, 64, 32);
			this.image = getImage('standButton');
		}
	});
	/**
	 * リザルト画面のボタン
	 */
	var ResultButton = enchant.Class.create(ButtonBase, {
		initialize : function(x, y, width, height) {
			ButtonBase.call(this, x-32, y-16, 64, 32);
			this.image = getImage('resultButton');
		}
	});

	/**
	 * トランプクラス
	 */
	var Trump = enchant.Class.create(ButtonBase, {
		// 初期化
		initialize : function(x, y, suit, number) {
			ButtonBase.call(this, x, y, 25, 41);
			this.suit	= suit;
			this.number = number;

			this.faceUp(); // 表向きにする
		},
		// 裏向きにする
		faceDown : function() {
			this.frame = 0;
			this.image = getImage("trumpFaceDown");
		 },
		 // 表向きにする
		faceUp : function() {
			this.image =  getImage("trump");
			this.frame = this.number-1+(this.suit*13);
		}
	});

	/**
	 * ステートマネージャー
	 * ”ステート”は描画物を管理する
	 */
	// ゲームのフェイズを管理するステートクラス
	var StateManager = enchant.Class.create({
		// 初期化
		initialize : function() {
			this.stateList = {
					Standby : new StandbyState({stateManager:this}),
//					Watch	: new WatchState(),
					Deal	: new DealState({stateManager:this})
//					Stand	: new StandState()
			}

			this.nowState = "Standby"; // TODO: ログインしたタイミングによって初期ステートは変わるのでここはテスト
			this.stateList[ this.nowState ].start(); // 最初のスタートを行う
		},
		// 状態を変える
		changeState : function(state, data) {
			this.stateList[ this.nowState ].finish();
			this.stateList[ state ].start(data);
			this.nowState = state;
		},
		// 何かしらの更新を加える処理
		update : function(stateName, eventName, data) {
			if(eventName != this.nowState) {
				console.log("エラー：現在のステートでないイベントが呼ばれた");
				return;
			}
			this.stateList[ this.nowState ].update(eventName, data);
		},
		// オブジェクトを現在のステートに追加
		addChild : function(name, object) {
			this.stateList[ this.nowState ].addChild(name, object);
		},
		// オブジェクトを現在のステートから削除
		removeChild : function(name) {
			this.stateList[ this.nowState ].removeChild(name);
		}
	});

	// ステートベース
	var StateBase = enchant.Class.create({
		initialize : function(data) {
			// メディエーターのように扱う
			this.stateManager = data.stateManager;
			// ゲームルートに追加した表示要素を記録する
			this.childList = new Array();
		},
		start : function() {

		},
		finish : function() {	// オブジェクトリストを消去

			for (var i in this.childList) {
				game.rootScene.removeChild(this.childList[i]);
				delete this.childList[i];
				//addLog(i+"を消去いたしました");
			}
		},
		addChild : function(name, object) {	// オブジェクトを追加

			// 同名のオブジェクトが既に生成されていた場合は
			if ( this.childList[name] )
			{
				// 古いオブジェクトを削除し、引数のオブジェクトを代入する
				console.log("だぶった！================================ : "+name);
				this.removeChild(name);
			}
			game.rootScene.addChild(object);
			this.childList[name] = object;
			console.log("登録完了=============================== : "+name);
		},
		removeChild : function(name) {//
			console.log("りむーぶ================================ : "+name);
			game.rootScene.removeChild(this.childList[name]);
			delete this.childList[name];
		}
	});
	/** ステート具象クラス達 **/

	// スタンバイステート
	var StandbyState = enchant.Class.create(StateBase, {
		initialize : function(data) {
			StateBase.call(this, data);
		},
		start : function() {
			stateManager = this.stateManager; // ステート管理者：ボタンにchange付けるために引っ張る
			// スタンバイボタン
			button = new StandbyButton(game.width/2-15, 230);
			button.addEventListener('touchstart', function() {

				// 正しく数値が入力されていれば
				if(! isNaN( document.betForm.text.value) ) {
					game.rootScene.removeChild(this);
					delete this;
					// スタンバイしたことをサーバーに知らせる
					socket.emit('standby', {betChip: document.betForm.text.value});

				} else {
					addLog("正しく数値を入力してください");
				}
			});
			this.addChild("standbyButton", button);

			// ベット金額を入力するフォーム
			var betForm = new Label("<form name='betForm' onsubmit='return false;'>" +
					"<input type='text' value=10 name='text' >"+
					"</form>"
			);
			betForm.x = 90; // game.width/2;
			betForm.y = 180; // game.height/2;
			this.addChild("betForm", betForm);

			// メッセージ
			var message = new Label("次のゲームでベットするチップを入力してください");
			message.font = "16 px Tahoma";
			message.color = "white";
			message.x = 50;
			message.y = 100;
			this.addChild("message", message);
		},
		update : function() {

		}
	});
	// ウォッチステート 観戦モード
	var WatchState = enchant.Class.create(StateBase, {
		initialize : function(data) {
			StateBase.call(this, data);
		}
	});
	// ディールステート
	var DealState = enchant.Class.create(StateBase, { // 手が成熟するまでこのステートをループ
		initialize : function(data) {
			StateBase.call(this, data);
		},
		start : function() {
		},
		update : function(eventName, data) {
		}
	});

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

}
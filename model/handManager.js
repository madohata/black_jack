exports.HandManager = function() {

	// 手札クラス
	this.Hand = function(id) {
		this.id;
		this.cardList	= new Array();
		this.isStand	= false;
		this.isHit		= false; // Hitを行ったか
		this.pushCard = function(card) {	// カードクラスを入れる
			this.cardList.push(card);
		}
		this.initialize = function() {
			for(var i in this.cardList) {
				delete this.cardList[i];
			}
			this.cardList	= new Array();
			this.isHit		= false;
			this.isStand	= false;
		}
	}

	// 手札配列
	this.handArray = new Array();

	/**
	 * 手札を作成する
	 */
	this.createHand = function(id) {
		this.handArray[id] = new this.Hand(id);
	}

	/**
	 * 手札を破棄する
	 */
	this.deleteHand = function(id) {
		delete this.handArray[id];
	}

	/**
	 * 現在登録中のハンドを全て初期化する
	 */
	this.handReset = function() {
		for (var i in this.handArray) {
			this.handArray[i].initialize();
		}
	}

	/**
	 * IDで指定した手札にカードを加える
	 * @param int  id
	 * @param class card
	 */
	this.pushCard = function(id, card) {
		this.handArray[id].pushCard(card);
	}

	/**
	 * pushCardしてHitフラグを立てる
	 * @param int  id
	 * @param class card
	 */
	this.hitCard = function(id, card) {
		this.handArray[id].isHit = true;
		this.pushCard(id, card);
	}

	/**
	 * IDで指定した手札のカード配列を取得する
	 * @param int id
	 * @return Array cardList
	 */
	this.getCardList = function(id) {
		return this.handArray[id].cardList;
	}

	/**
	 * 手札の合計値を算出する関数
	 * @param string socketId
	 * @return int 手札の合計値
	 */
	this.calcHand = function(id) {
		console.log("計算関数--------------------------");

		var cardList = this.handArray[id].cardList;
		var sum = 0;
		var aceCount = 0;

		// 各カードを加算
		for (var i in cardList) {
			if(cardList[i].number >= 11) {	// 11以上は10として計算
				sum += 10;
				console.log(cardList[i].number+"は10としてカウント");
			} else if(cardList[i].number == 1){ // 1は21を超えない限りは11として扱う
				aceCount++;
				console.log("エース");
			} else {
				sum += cardList[i].number;
				console.log("数値　: "+cardList[i].number);
			}
		}

		// エースは場合分けして加算
//		for(var i=0; i<aceCount; i++) {
//			if( sum + (aceCount-i)*11 <= 21) { // 11を足して21を超えないようなら11として加算
//				sum += 11;
//			} else {
//				sum += 1;		// 越えてしまうようなら1として加算
//			}
//		}
		// aceを2回11として足さないという性質から、まず全ての一を足してその後10加算できるならする、と言う方法でも良いはず
		if(aceCount) {
			sum += aceCount;
			if(sum + 10 <= 21) {
				sum += 10;
			}
		}

		console.log("現在の合計値は"+sum);
		return sum;
	}

	/**
	 * バーストしているか？
	 * @param string socketId
	 * @return boolean
	 */
	this.isBurst = function(id) {
		if(this.calcHand(id) > 21) {
			return true;
		}
		return false;
	}

	/**
	 * Hit出来る状態か？
	 */
	this.canHit = function(id) {
		console.log("+++++++++ヒットできるのか？+++++++++++++++++++++++");
		console.log(this.calcHand(id)+"++++++++++++++++++++++++++++++++++++++calc");
		console.log(this.isStand(id)+"++++++++++++++++++++++++++++++++++++++stand");
		console.log(this.wasHit(id)+"++++++++++++++++++++++++++++++++++++++washit");

		if(this.calcHand(id) <= 21 && this.isStand(id) == false && this.wasHit(id) == false ) {
			console.log("----------------ヒットできる");
			return true;
		}
		return false;
	}

	/**
	 * 全員Hit出来る状態か調べる
	 * ヒットできる状態かつ、このターンまだヒットをしていない
	 */
	this.canNotHitAll = function() {
		for(var i in this.handArray) {
			if (this.canHit(i)) {	// 1人でもHit出来るものがいたらfalseを返す
				return false;
			}
		}
		return true;
	}

	/**
	 * Standかバースト状態か調べる
	 * （21丁度かバーストしているかスタンド宣言をしているか）
	 */
	this.isStanding = function(id) {
		if (this.calcHand(id) >= 21 || this.isStand(id)) {
			return true;
		}
		return false;
	}

	/**
	 * スタンドする
	 */
	this.setStand = function(id) {
		console.log("----------------スタンド状態になるのはここだけ");
		this.handArray[id].isStand = true;
	}
	/**
	 * スタンドしているか
	 */
	this.isStand = function(id) {
		return this.handArray[id].isStand;
	}

	/**
	 * このターン既にヒットしているか
	 */
	this.wasHit = function(id) {
		return this.handArray[id].isHit;
	}

	/**
	 * 全員のHitフラグをfalseに戻す
	 */
	this.AllHitFlagReset = function () {
		for (var i in this.handArray) {
			this.handArray[i].isHit = false;
		}
	}

	/**
	 * 手がブラックジャックか
	 * TODO:スプリットを入れる場合、スプリット後の手札はブラックジャックにならないので注意が必要
	 * TODO:役の判定処理が見づらいので時間があれば整理する
	 */
	this.isBlackJack = function (id) {
		if(this.handArray[id].length == 2) { // 手札が2枚
			var cardList = this.handArray[id].cardList;
			if(cardList[0].number == 11 || cardList[0].number == 1) {	// 11があるか
				if(cardList[0].number == 11 || cardList[0].number == 1) { // 1があるか
					return true;
				}
			}
		}
		return false;
	}

}
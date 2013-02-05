exports.HandManager = function() {

	// 手札クラス読み込み
	var Hand = require('./hand').Hand;

	// 手札配列
	this.handArray = new Array();

	/**
	 * 手札を作成する
	 */
	this.createHand = function(id) {
		this.handArray[id] = new Hand();
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
		this.handArray[id].setHit();
		this.handArray[id].pushCard(card);
	}

	/**
	 * IDで指定した手札のカード配列を取得する
	 * @param int id
	 * @return Array cardList
	 */
	this.getCardList = function(id) {
		return this.handArray[id].getHand();
	}

	/**
	 * 手札の合計値を算出する関数
	 * @param string socketId
	 * @return int 手札の合計値
	 */
	this.calcHand = function(id) {
		return this.handArray[id].calcHand();
	}

	/**
	 * バーストしているか？
	 * @param string socketId
	 * @return boolean
	 */
	this.isBurst = function(id) {
		return this.handArray[id].isBurst();
	}

	/**
	 * Hit出来る状態か？
	 */
	this.canHit = function(id) {

		console.log("ヒット : "+this.handArray[id].isHit());
		console.log("スタンド : "+this.isStand(id));
		console.log("ヒット可能か？"+this.calcHand(id));
		if(this.calcHand(id) <= 21 && this.isStand(id) == false && this.handArray[id].isHit() == false ) {

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
	 * （バーストしているかスタンド宣言をしているか）
	 */
	this.isStanding = function(id) {
		if (this.isBurst(id) || this.isStand(id)) {
			return true;
		}
		return false;
	}

	/**
	 * スタンドする
	 */
	this.setStand = function(id) {
		this.handArray[id].setStand()
	}
	/**
	 * スタンドしているか
	 */
	this.isStand = function(id) {
		return this.handArray[id].isStand();
	}

	/**
	 * このターン既にヒットしているか
	 */
	this.wasHit = function(id) {
		return this.handArray[id].isHit();
	}

	/**
	 * 全員のHitフラグをfalseに戻す
	 */
	this.AllHitFlagReset = function () {
		for (var i in this.handArray) {
			this.handArray[i].resetHit();
		}
	}

	/**
	 * 手がブラックジャックか
	 */
	this.isBlackJack = function (id) {
		return this.handArray[id].isBlackJack();
	}

	/**
	 * 伏せカードのデータを取得する
	 */
	this.getHoldCardData = function(id) {
		return this.handArray[id].getHoldCardData();
	}
}
exports.Dealer = function () {

	// 手札クラス読み込み
	var Hand = require('./hand').Hand;

	// ディーラーの手札
	this.hand	 = new Hand();
	this.isStand = false;

	// ディーラーにカードを１枚追加する
	this.pushCard = function(card) {
		this.hand.pushCard(card);
	}
	// ディーラーのカードを取得する
	this.getHand = function() {
		return this.hand.getHand();
	}
	// ヒットしなければならないか？
	this.willHit = function() {
		// 16以下なら引く
		if(this.hand.calcHand() <= 16) {
			console.log("16以下なのでまだ引くことができる");
			return true;
		}
		console.log("17以上ならここでスタンドする");
		return false;
	}
	// スタンドする
	this.setStand = function() {
		this.hand.setStand();
	}
	// スタンドしているか？
	this.isStand = function() {
		return this.hand.isStand();
	}
	// バーストしているか
	this.isBurst = function() {
		this.hand.isBurst();
	}
	this.calcHand = function() {
		return this.hand.calcHand();
	}
	this.deleteHand = function() {
		this.hand.initialize();
	}
	/**
	 * 裏返しにしていた2枚目のカードの情報を取得する
	 * TODO:ホールドカードを特別扱いするなどの処理をつかた方が良いかもしれない（直接2番目を指定するのは良くない)
	 */
	this.getHoldCardData = function() {
		return this.hand.getHoldCardData();
	}
}
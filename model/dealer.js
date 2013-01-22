exports.Dealer = function () {

	// ディーラーの手札
	this.hand	 = new Array();
	this.isStand = false;

	// ディーラーにカードを１枚追加する
	this.pushCard = function(card) {
		this.hand.push(card);
	}
	// ディーラーのカードを取得する
	this.getHand = function() {
		return this.hand;
	}
	// ヒットしなければならないか？
	this.willHit = function() {
		// 16以下なら引く
		if(this.calcHand() <= 16) {
			console.log("16以下なのでまだ引くことができる");
			return true;
		}
		console.log("17以上ならここでスタンドする");
		return false;
	}
	// スタンドする
	this.setStand = function() {
		this.isStand = true;
	}
	// スタンドしているか？
	this.isStand = function() {
		return this.isStand;
	}
	// バーストしているか
	this.isBurst = function() {
		if(this.calcHand() > 21) {
			return true;
		}
		return false;
	}
	this.calcHand = function() {
		//TODO:カードの点数計算がhandManagerとかぶっているのでモジュール化する必要がある
		var sum = 0;
		var aceCount = 0;
		var cardList = this.hand;

		// 各カードを加算
		for (var i in cardList) {
			if(cardList[i].number >= 11) {	// 11以上は10として計算
				sum += 10;
				console.log("ディーラー"+cardList[i].number+"は10としてカウント");
			} else if(cardList[i].number == 1){ // 1は21を超えない限りは11として扱う
				aceCount++;
				console.log("ディーラー：エース");
			} else {
				sum += cardList[i].number;
				console.log("ディーラー　: "+cardList[i].number);
			}
		}

	if(aceCount) {
			sum += aceCount;
			if(sum + 10 <= 21) {
				sum += 10;
			}
		}

		console.log("ディーラー：現在の合計値は"+sum);
		return sum;
	}
	this.deleteHand = function() {
		for(var i in this.hand) {
			delete this.hand[i];
		}
		this.hand = new Array();
	}
	/**
	 * 裏返しにしていた2枚目のカードの情報を取得する
	 * TODO:ホールドカードを特別扱いするなどの処理をつかた方が良いかもしれない（直接2番目を指定するのは良くない)
	 */
	this.getHoldCardData = function() {
		return this.hand[1];
	}
}
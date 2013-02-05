exports.Hand = function() {
	
	// カードリスト
	this.cardList		= new Array();
	// スタンド状態か
	this.standFlag		= false;
	// ヒット状態か
	this.hitFlag		 = false;
	
	/**
	 * 初期化
	 */
	this.initialize = function() {
		for(var i in this.cardList) {
		 delete this.cardList[i];
		}
		this.cardList	= new Array();
		this.standFlag	= false;
		this.hitFlag	= false;
	}
	
	/**
	 * カードを一枚追加する
	 */
	 this.pushCard = function(card) {
	 	this.cardList.push(card);
	 }
	 
	 /**
	  * カードリストを取得する
	  */
	 this.getHand = function() {
	 	return this.cardList;
	 }
	 
	 /**
	  * スタンドする
	  */
	 this.setStand = function() {
	 	this.standFlag = true;
	 }
	 
	 /**
	  * スタンドしているか？
	  */
	 this.isStand = function() {
	 	return this.standFlag;
	 }
	 
	 /**
	  * ヒットする
	  */
	 this.setHit = function() {
	 	this.hitFlag = true;
	 }
	 /**
	  * ヒット状態を解除する
	  */
	 this.resetHit = function() {
	 	this.hitFlag = false;
	 }
	 /**
	  * ヒットしているか
	  */
	 this.isHit = function() {
	 	return this.hitFlag;
	 }
	 
	 // バーストしているか
	 this.isBurst = function() {
	 	return (this.calcHand() > 21) ? true : false;
	 }

	/**
	 * 手札の点数を計算
	 */
	this.calcHand = function() {
		var sum  =0;
		var aceCount = 0;
		
		// 各カードを加算
		for (var i in this.cardList) {
			if(this.cardList[i].number >= 11) { // 11以上は10として計算
				sum += 10;
			} else if(this.cardList[i].number == 1) { // 1は21を超えない限りは11として扱う
				aceCount++;
			} else {
				sum += this.cardList[i].number;
			}
		}
		
		if(aceCount) {
			sum += aceCount;
			if(sum + 10 <= 21) {
				sum += 10;
			}
		}
		return sum;
	}
	
	/**
	 * 手がブラックジャックか
	 */
	this.isBlackJack = function(id) {
		if(this.cardList.length == 2) { // 手札が2枚
			if(this.cardList[0].number == 11 || this.cardList[1].number == 11) {
				if(this.cardList[0].number == 1 || this.cardList[1].number == 1) {
					true;
				}
			}
		}
		return false;
	}
	
	/**
	 * 伏せカードのデータを取得する
	 */
	this.getHoldCardData = function(id) {
		return this.cardList[1];
	}
}
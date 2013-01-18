exports.Cards = function () {

	// 投入したデッキの総数
	this.deckNum = 0;
	// 山札
	this.deck	= new Array();
	// 出力する際に使う文字セット
	var SUIT = {0: "スペード", 1: "ハート", 2: "クローバー", 3:"ダイヤ"};
	// カードにつけるID
	this.totalGeneratedCard = 0;

	// カードのデータ構造体
	this.Card = function(id, suit, number) {
		this.id		= id;
		this.suit	= suit;
		this.number = number;
		this.suitStr = SUIT[suit];
	}
	/**
	 * 初期化関数
	 * @param int デックの数　現在は仮に4スーツ13番号までの計52枚を1デックとする。
	 */
	// TODO: Javascriptのコンストラクタについてもうちょっと調べてみる
	this.initialize = function (deckNum) {
		this.deckNum = deckNum; // 初期投入のデッキ数を格納

	}

	/**
	 * カードをシャッフルする
	 */
	this.shuffleCards = function() {
		// 線形配列を使ってカードをシャッフルする
		var tempDeck		= new Array();
		var outputArray		= new Array(this.deck.length);

		for(var i=0; i<this.deck.length; i++) {

			tempDeck[i] = this.deck[i];
		}

		for(var i=0; i<this.deck.length; i++) {

			popElementIndex = Math.floor(Math.random() * tempDeck.length); // 残った数字リストの中からランダムで1つ選ぶ
			popElement = tempDeck[popElementIndex]; // ランダムで決まった値を抽出
			tempDeck.splice(popElementIndex, 1); // 線形配列みたいに「削除して要素を詰める」

			outputArray[i] = popElement;
		}

		this.deck = outputArray;
	}

	// カードを引く
	this.drawCard = function() {

		// TODO:デッキを追加するタイミングについては調整の可能性がある
		if(this.deck.length == 0) {
			this.addDeckAndShuffle();
		}

		var output = this.deck.shift();
		this.total--;
		return output;
	}

	// カードを複数枚引く TODO: カードが底をついたときの処理を書いていない
	this.drawCards = function(drawNum) {

		var outputCards = new Array();
		for(var i=0; i<drawNum; i++) {
			outputCards.push( this.deck.shift() );  // TODO:一応、spliceと言う複数削除出来る関数もあるがとりあえずこうしておく。
			this.total--;
		}

		return outputCards;
	}

	// カードの残り枚数を取得
	this.getCardNum = function() {
		return this.deck.length;
	}

	// デックを追加してシャッフル
	this.addDeckAndShuffle = function() {
		this.deckNum + 4;
		this.addDeck(4);
		this.shuffleCards();
	}

	//
	this.addDeck = function(deckNum) {
		for (var i=0; i<deckNum; i++) {
			for (var suit=0; suit<4; suit++) { // マーク
				for (var number=1; number<=13; number++) { // 数字
					this.deck.push( new this.Card(this.totalGeneratedCard,suit,number) ); // totalでID付けをする → .lengthで省略できそう
					this.totalGeneratedCard++;
				}
			}
		}
	}
}
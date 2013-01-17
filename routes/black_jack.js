
/**
 * ブラックジャック用コントローラー
 * TODO:クライアントからsocketイベントキーワードが不正に贈られた場合どう対応するか
 */


 exports.black_jack = function(req, res) {
	
 	// テンプレート表示
 	res.render('black_jack', { title: 'BlackJack', layout: false});
 }

/*
 * GET home page.
 */

exports.index = function(req, res){
	// テンプレートを表示
  res.render('index', { title: 'Express', layout: false});
};
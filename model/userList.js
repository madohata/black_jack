exports.UserList = function () {

	this.userCount	= 0;
	this.userList 	= new Array();
	// ユーザーデータを登録
	this.setUserData = function(socketId, easyId, x, y, nickname) {
		this.userList[socketId] = {easyId: easyId, x: x, y: y, nickname: nickname};
	}
	// ユーザーデータを取得
	this.getUserData = function(socketId) {
		return this.userList[socketId];
	}
	// ユーザーデータを全件取得
	this.getUserDataAll = function() {
		return this.userList;
	}
	// ユーザーデータをクライアントで扱う形式にしてすべて取得
	this.getLoginUserDataAll = function() {
		var loginUserList = new Array();
		for(var i in this.userList) {
			loginUserList[ this.userList[i].easyId ] = {
					x: this.userList[i].x,
					y: this.userList[i].y,
					nickname: this.userList[i].nickname,
					id: this.userList[i].easyId
			}
		}
		return loginUserList;
	}
	// ユーザーデータを削除
	this.removeUserData = function(socketId) {
		delete this.userList[socketId];
	}
	// データが存在しているか判定 //TODOとりあえずまだ処理をさせない
	this.isRegisted = function(socketId) {
		return ( socketId in this.userList[socketId] ) ? true : false;
	}
}
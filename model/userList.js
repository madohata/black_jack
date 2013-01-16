exports.UserList = function () {

	this.userCount	= 0;
	this.userList 	= new Array();
	this.watcherList = new Array();
	// シート番号
	this.seatArray	= new Array(false, false, false, false, false); // 5席

	this.User = function(countNumber, nickname, chip) {
		this.countNumber	= countNumber;
		this.nickname		= nickname;
		this.chip			= chip;
		this.isStandby		= false;
		this.betChip		= 0;
	}

	/**
	 * ユーザーデータを登録
	 */
	this.setUserData = function(userId , nickname, chip) {

		// 空席検索
		var seatNumber = this.setSeat();
		if(seatNumber == -1) {return false;} // TODO:席の限界を超えていた場合の処理を追加する


		this.userList[userId] = new this.User(seatNumber, nickname, chip);

		this.userCount++;
	}

	/**
	 * 観戦者を登録する
	 */
	this.setWatcherData = function(userId, nickname) {
		this.watcherList.push( {userId:userId, nickname: nickname} );
	}

	/**
	 * ユーザーデータを取得
	 */
	this.getUserData = function(userId) {
		return this.userList[userId];
	}

	/**
	 * ユーザーデータを全件取得
	 */
	this.getUserDataAll = function() {
		return this.userList;
	}

	/**
	 * ユーザーデータをクライアントで扱う形式にしてすべて取得
	 */
	this.getUserDataAllForClient = function() {
		var outputArray = new Array();
		for(var i in this.userList) {
			outputArray.push(this.userList[i]);
		}
		return outputArray;
	}

	/**
	 * ユーザーデータを削除
	 */
	this.removeUserData = function(userId) {

		// 席を空ける
		console.log("userId: "+userId);
		console.log("this.userList[userId] : "+this.userList[userId]);
		console.log("席番号は : "+this.userList[userId].countNumber);
		this.unsetSeat( this.userList[userId].countNumber );

		delete this.userList[userId];
	}

	/**
	 * データが存在しているか判定 //TODOとりあえずまだ処理をさせない
	 */
	this.isRegisted = function(userId) {
		return ( userId in this.userList[userId] ) ? true : false;
	}

	/**
	 * 指定したユーザーのスタンバイフラグをtrueにする
	 */
	this.setStandby = function(userId) {
		console.log("userId : "+userId);
		console.log("nakami"+this.userList[userId]);
		this.userList[userId].isStandby = true;
	}
	/**
	 * 全てのユーザーのスタンバイフラグがtrueになっているか
	 */
	this.allUsersIsStandby = function() {

		for (var i in this.userList) {
			if (! this.userList[i].isStandby) {	// 1人でもスタンバイしていなければfalse
				return false;
			}
		}

		return true;
	}
	/**
	 * すべてのユーザーのスタンバイフラグをfalseにする
	 */
	this.resetAllStanbyFlag = function() {
		for (var i in this.userList) {
			this.userList[i].isStandby = false;
		}
	}

	/**
	 * チップを追加する
	 */
	this.addChip = function(userId, value) {
		this.userList[userId].chip += value;
	}
	/**
	 * 賭け金をリセットして報酬を受け取る
	 */
	this.refund = function(userId, value) {
		this.userList[userId].chip		 += value;
		this.userList[userId].betChip	 = 0;
	}
	/**
	 * チップをかける
	 */
	this.betChip = function(userId, value) {

		if(value > this.userList[userId].chip) {
			value = this.userList[userId].chip;
		}

		this.userList[userId].chip		-= value;
		this.userList[userId].betChip	 = value;
	}
	/**
	 * チップの数を取得する
	 */
	this.getChip = function(userId, value) {
		return this.userList[userId].chip;
	}

	/**
	 * 現在のプレイヤー数を取得する
	 */
	this.getUserNum = function() {
		var num = 0;
		for(var i in this.userList) {
			if(this.userList[i]) { // 空でなければカウント
				num++;
			}
		}
		return num;
	}

	/**
	 * 空席を返す
	 */
	this.isEmptySeat = function() {
		for(var i in this.seatArray) {
			if(this.seatArray[i] == false) {
				return 	true;
			}
		}
		return false;
	}
	/**
	 * 席を埋める
	 */
	this.setSeat = function() {
		for(var i in this.seatArray) {
			if(this.seatArray[i] == false) {
				this.seatArray[i] = true;

				return i;
			}
		}
		console.log("-席が取得できませんでした-----------------------------------");
		return -1;
	}

	/**
	 * 席を空ける
	 */
	this.unsetSeat = function(number) {
		this.seatArray[number] = false;
	}

}
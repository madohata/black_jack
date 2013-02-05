exports.Hand = function() {
	
	// �J�[�h���X�g
	this.cardList		= new Array();
	// �X�^���h��Ԃ�
	this.standFlag		= false;
	// �q�b�g��Ԃ�
	this.hitFlag		 = false;
	
	/**
	 * ������
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
	 * �J�[�h���ꖇ�ǉ�����
	 */
	 this.pushCard = function(card) {
	 	this.cardList.push(card);
	 }
	 
	 /**
	  * �J�[�h���X�g���擾����
	  */
	 this.getHand = function() {
	 	return this.cardList;
	 }
	 
	 /**
	  * �X�^���h����
	  */
	 this.setStand = function() {
	 	this.standFlag = true;
	 }
	 
	 /**
	  * �X�^���h���Ă��邩�H
	  */
	 this.isStand = function() {
	 	return this.standFlag;
	 }
	 
	 /**
	  * �q�b�g����
	  */
	 this.setHit = function() {
	 	this.hitFlag = true;
	 }
	 /**
	  * �q�b�g��Ԃ���������
	  */
	 this.resetHit = function() {
	 	this.hitFlag = false;
	 }
	 /**
	  * �q�b�g���Ă��邩
	  */
	 this.isHit = function() {
	 	return this.hitFlag;
	 }
	 
	 // �o�[�X�g���Ă��邩
	 this.isBurst = function() {
	 	return (this.calcHand() > 21) ? true : false;
	 }

	/**
	 * ��D�̓_�����v�Z
	 */
	this.calcHand = function() {
		var sum  =0;
		var aceCount = 0;
		
		// �e�J�[�h�����Z
		for (var i in this.cardList) {
			if(this.cardList[i].number >= 11) { // 11�ȏ��10�Ƃ��Čv�Z
				sum += 10;
			} else if(this.cardList[i].number == 1) { // 1��21�𒴂��Ȃ������11�Ƃ��Ĉ���
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
	 * �肪�u���b�N�W���b�N��
	 */
	this.isBlackJack = function(id) {
		if(this.cardList.length == 2) { // ��D��2��
			if(this.cardList[0].number == 11 || this.cardList[1].number == 11) {
				if(this.cardList[0].number == 1 || this.cardList[1].number == 1) {
					true;
				}
			}
		}
		return false;
	}
	
	/**
	 * �����J�[�h�̃f�[�^���擾����
	 */
	this.getHoldCardData = function(id) {
		return this.cardList[1];
	}
}
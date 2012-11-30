
/**
 * �u���b�N�W���b�N�p�R���g���[���[
 */

 exports.black_jack = function(req, res) {

	 // Socket.io�̏���
	 var app = require('express').createServer();
	 var io = require('socket.io').listen(app.listen(3001)) // TODO:�Ƃ肠����3001�ԂƂ��Ă��邪�A���������̂���|�[�g�ɕύX������

	/**
	 * ���[�U�[���̊Ǘ�
	 */
	var UserList = require('../model/userList').UserList;
	var userList = new UserList();
	
	/**
	 * �ʐM�C�x���g���X�i�o�^
	 */
	 io.sockets.on('connection', function(socket) {
	 	// �ڑ��������������Ƃ��N���C�A���g�ɒʒm
	 	socket.emit('connected');
	 	
	 	// �T�[�o�T�C�h�@socketio�C�x���g���X�i
	 	/**
	 	 * �ڑ����r�؂ꂽ���̃C�x���g
	 	 */
	 	 socket.on('disconnect', function() {
	 	 	
	 	 	// �ڑ����؂ꂽ���Ƃ�S�N���C�A���g�ɒʒm
	 	 	io.sockets.emit('user_disconnected', {});
	 	 	// ���[�U�[���X�g����f�[�^���폜
	 	 	userList.removeUserData(socket.id);
	 	 }
	 	 
	 	 /**
	 	  * �n���h�V�F�C�N���������ă��[�U�[�����O�C���������̃C�x���g
	 	  */
	 	  socket.on('login', function(data) {
	 	  	// �����[�U�[�̃N���C�A���g��
	 	  	
	 	  	// ���[�U�[���X�g�Ƀ��[�U�[��o�^
	 	  	userList.setUserData();
	 	  })
	 	 
 	// �e���v���[�g�\��
 	res.render('black_jack', { title: 'BlackJack'});
 };
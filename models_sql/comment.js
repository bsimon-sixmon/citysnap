module.exports = function(sequelize, DataTypes) {

	var Comment = sequelize.define('comment', {
		UserId: { type : DataTypes.INTEGER, field : 'user_id' },
		PhotoId: { type : DataTypes.INTEGER, field : 'photo_id' },
		Horodate: { type: DataTypes.DATE, field : 'horodate' },
		Comment : { type: DataTypes.TEXT, field : 'comment' },
	}, {
		underscored: true
	});

return Comment;
}

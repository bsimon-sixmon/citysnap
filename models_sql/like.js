module.exports = function(sequelize, DataTypes) {

	var Like = sequelize.define('like', {
		UserId: { type : DataTypes.INTEGER, field : 'user_id' },
		PhotoId: { type : DataTypes.INTEGER, field : 'photo_id' },
		Horodate: { type: DataTypes.DATE, field : 'horodate' }
	}, {
		underscored: true
	});

return Like;
}

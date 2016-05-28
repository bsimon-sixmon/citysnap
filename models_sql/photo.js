module.exports = function(sequelize, DataTypes) {

	var Photo = sequelize.define('photo', {

		Author: { type : DataTypes.STRING, field : 'author' },
		Name: { type : DataTypes.STRING, field : 'name' },
		Description: { type : DataTypes.STRING, field : 'description' },
		Credits: { type : DataTypes.STRING, field : 'credits' },
		Url: { type : DataTypes.STRING, field : 'url' },
		StartYear: { type : DataTypes.INTEGER, field : 'start_year' },
		EndYear: { type : DataTypes.INTEGER, field : 'end_year' },
		PublicId: { type : DataTypes.STRING, field : 'public_id' },
		Hash: { type : DataTypes.STRING, field : 'hash' },
		Width: { type : DataTypes.INTEGER, field : 'width' },
		Height: { type : DataTypes.INTEGER, field : 'height' },
		Latitude: 	{ type: DataTypes.FLOAT, defaultValue: 0.0, field : 'latitude' },
		Longitude : { type: DataTypes.FLOAT, defaultValue: 0.0, field : 'longitude' },
		UserId: { type : DataTypes.INTEGER, field : 'user_id' }
	}, {
		underscored: true
	});

return Photo;
}

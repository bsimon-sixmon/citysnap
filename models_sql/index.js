var config = require("../config/config").config() 
, fs = require('fs')
, path = require('path')
, Sequelize = require('sequelize')
, lodash = require('lodash')
, sequelize = new Sequelize(config.sql_db_name, config.sql_user, config.sql_password, { host: config.sql_host, dialect : "postgres", port : config.sql_port /*, logging: false*/ })
//, sequelize = new Sequelize('skillsaround', 'postgres', 'JuVT75XX', { host : "skillsaround.com" , dialect : "postgres", port : 5432 /*, logging: false*/ })
, db = {};

console.log(config);

fs
.readdirSync(__dirname)
.filter(function(file) {
	console.log(file);
	return (file.indexOf('.') !== 0) && (file !== 'index.js');
})
.forEach(function(file) {
	var model = sequelize.import(path.join(__dirname, file));
	//console.log(model);
	db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
	if ('associate' in db[modelName]) {
		db[modelName].associate(db);
	}
});

// Associations
//db.user.hasMany(db.skill, { through: 'user_skills', as : 'Skills' });
//db.skill.hasMany(db.user, { through: 'user_skills' });

// Sync DB
sequelize.sync();

// Db Helpers for Eagerly loaded associations
/*db.getValuesFromRows = function(rows, associations) {
    // get POD (plain old data) values
    var values;
    if (rows instanceof Array) {
        // call this method on every element of the given array of rows
        values = [];
        for (var i = 0; i < rows.length; ++i) {
            // recurse
            values[i] = this.getValuesFromRows(rows[i], associations);
        }
    }
    else if (rows) {
        // only one row
        values = rows.dataValues;

        // get values from associated rows
        if (values && associations) {
            for (var i = 0; i < associations.length; ++i) {
                var association = associations[i];
                var propName = association.as;

                // recurse
                values[propName] = this.getValuesFromRows(values[propName], association.include);
            };
        }
    }

    return values;
};*/


module.exports = lodash.extend({
	sequelize: sequelize,
	Sequelize: Sequelize
}, db);
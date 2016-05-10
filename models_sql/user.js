module.exports = function(sequelize, DataTypes) {
	
	var User = sequelize.define('user', {
		Id : { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, unique: true, field : 'id' },
		LastName: { type : DataTypes.STRING, field : 'last_name' },
		FirstName: { type : DataTypes.STRING, field : 'first_name' },
		Email: { type: DataTypes.TEXT, unique: true, allowNull: false, field : 'email'},
		Password: { type : DataTypes.STRING, field : 'password' },
	    Salt: { type : DataTypes.STRING, field : 'salt' },
	    FacebookUid: { type : DataTypes.STRING, field : 'facebook_uid' }
	}, {
		underscored: true,
		instanceMethods: {
			getFullname: function() {
				if(this.LastName && this.FirstName)
					return [this.FirstName, this.LastName].join(' ')
				else if(this.TwitterUsername)
					return this.TwitterUsername;
				else if(this.Email)
					return this.Email
				else
					return ""; //SHOULD NEVER OCCUR
			},
			validPassword: function(password)
		    {
		        if(this.password === this.encryptPassword(password))
		        	return true;
		        else 
		        	return false;
		    },

		    authenticate: function(plainText) {
		        return this.encryptPassword(plainText) === this.password;
		    },

		    makePassword: function(pass) {
	            console.log("setting password");
		        if(!this.salt){
		                this.salt = this.makeSalt();
		        }
		        this.password = this.encryptPassword(pass);
			},

		    makeSalt: function() {
		        return require("randomstring").generate();
		    },

		    encryptPassword: function(password) {
		        return require('crypto').createHmac('sha1', this.salt).update(password).digest('hex');
		    }
		}
	});

return User;
}
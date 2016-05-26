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
				else if(this.Email)
					return this.Email
				else
					return ""; //SHOULD NEVER OCCUR
			},
			validPassword: function(password)
		    {
		        if(this.Password === this.encryptPassword(password))
		        	return true;
		        else 
		        	return false;
		    },

		    authenticate: function(plainText) {
		        return this.encryptPassword(plainText) === this.Password;
		    },

		    makePassword: function(pass) {
	            console.log("setting password");
		        if(!this.Salt){
		                this.Salt = this.makeSalt();
		        }
		        this.Password = this.encryptPassword(pass);
			},

		    makeSalt: function() {
		        return require("randomstring").generate();
		    },

		    encryptPassword: function(password) {
		    	console.log(password);
		        return require('crypto').createHmac('sha1', this.Salt).update(password).digest('hex');
		    }
		}
	});

return User;
}
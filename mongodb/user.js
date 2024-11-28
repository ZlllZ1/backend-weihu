const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const userSchema = new Schema({
	account: String,
	password: String,
	token: String,
	nickname: String,
	sex: Number,
	age: Number,
	idCard: String,
	birthDate: String,
	phone: String,
	email: String,
	avatar: String,
	introduction: String,
	friendBg: String,
	homeBg: String,
	ipRegion: String,
	registrationDate: { type: Date, default: Date.now },
	lastLoginDate: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

module.exports = User

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
	circleBg: String,
	homeBg: String,
	live: String,
	ipAddress: String,
	followNum: { type: Number, default: 0 },
	fanNum: { type: Number, default: 0 },
	postNum: { type: Number, default: 0 },
	friendNum: { type: Number, default: 0 },
	circleNum: { type: Number, default: 0 },
	registrationDate: { type: Date, default: Date.now },
	lastLoginDate: { type: Date, default: Date.now },
	setting: { type: mongoose.Schema.Types.ObjectId, ref: 'Setting' }
})

const User = mongoose.model('User', userSchema)

module.exports = User

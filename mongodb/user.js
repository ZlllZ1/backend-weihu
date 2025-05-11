const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
	account: String,
	password: String,
	refreshToken: String,
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
	praiseNum: { type: Number, default: 0 },
	friendNum: { type: Number, default: 0 },
	circleNum: { type: Number, default: 0 },
	collectNum: { type: Number, default: 0 },
	registrationDate: { type: Date, default: Date.now },
	lastLoginDate: { type: Date, default: Date.now },
	setting: { type: mongoose.Schema.Types.ObjectId, ref: 'Setting' }
})

userSchema.index({ account: 1 }, { unique: true })
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ phone: 1 }, { unique: true })
userSchema.index({ nickname: 'text' })
userSchema.index({ live: 1 })
userSchema.index({ registrationDate: -1 })

const User = mongoose.model('User', userSchema)

module.exports = User

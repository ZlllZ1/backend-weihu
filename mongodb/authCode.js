const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const authCodeSchema = new Schema({
	email: String,
	code: String,
	expires: Number
})

const AuthCode = mongoose.model('AuthCode', authCodeSchema)

module.exports = AuthCode

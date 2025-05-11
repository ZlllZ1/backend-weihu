const mongoose = require('mongoose')
const Schema = mongoose.Schema

const authCodeSchema = new Schema({
	email: { type: String, index: true },
	code: { type: String, index: true },
	expires: Number
})

const AuthCode = mongoose.model('AuthCode', authCodeSchema)

module.exports = AuthCode

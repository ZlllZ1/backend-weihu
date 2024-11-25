const mongoose = require('./index.js')
const Schema = mongoose.Schema

const blackListSchema = new Schema({
	userId: String,
	blackList: Array
})

const BlackList = mongoose.model('BlackList', blackListSchema)

module.exports = BlackList

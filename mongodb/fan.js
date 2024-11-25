const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const fanSchema = new Schema({
	fanUserId: String,
	followedUserId: String,
	fanDate: { type: Date, default: Date.now }
})

const friendSchema = new Schema({
	userId1: String,
	userId2: String,
	friendDate: { type: Date, default: Date.now }
})

const Fan = mongoose.model('Fan', fanSchema)
const Friend = mongoose.model('Friend', friendSchema)

module.exports = { Fan, Friend }

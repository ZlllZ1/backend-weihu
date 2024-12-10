const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const fanSchema = new Schema({
	fanEmail: String,
	followedEmail: String,
	fanDate: { type: Date, default: Date.now }
})

const friendSchema = new Schema({
	email1: String,
	email2: String,
	friendDate: { type: Date, default: Date.now }
})

const Fan = mongoose.model('Fan', fanSchema)
const Friend = mongoose.model('Friend', friendSchema)

module.exports = { Fan, Friend }

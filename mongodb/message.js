const mongoose = require('mongoose')
const Schema = mongoose.Schema

const messageSchema = new Schema({
	chatId: String,
	email: String,
	content: String,
	sendDate: { type: Date, default: Date.now }
})

const Message = mongoose.model('Message', messageSchema)

module.exports = Message

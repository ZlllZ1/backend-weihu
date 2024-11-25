const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const messageSchema = new Schema({
	messageId: String,
	chatId: String,
	userId: String,
	content: String,
	sendDate: { type: Date, default: Date.now }
})

const Message = mongoose.model('Message', messageSchema)

module.exports = Message

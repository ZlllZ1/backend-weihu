const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const chatSchema = new Schema({
	chatId: String,
	users: [
		{
			email: String,
			unreadCount: { type: Number, default: 0 }
		},
		{
			email: String,
			unread_count: { type: Number, default: 0 }
		}
	],
	lastMessage: { type: String, default: '' },
	lastMessageTime: { type: Date, default: Date.now }
})

const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat

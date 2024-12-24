const mongoose = require('mongoose')
const Schema = mongoose.Schema

const chatSchema = new Schema(
	{
		chatId: { type: String, required: true, unique: true },
		participants: [
			{
				email: { type: String, ref: 'User', required: true },
				unreadCount: { type: Number, default: 0 },
				nickname: String,
				avatar: String
			}
		],
		lastMessage: {
			content: { type: String, default: '' },
			senderEmail: { type: String, ref: 'User' },
			timestamp: { type: Date, default: Date.now }
		},
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now }
	},
	{ timestamps: true }
)
chatSchema.index({ participants: 1 })

const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat

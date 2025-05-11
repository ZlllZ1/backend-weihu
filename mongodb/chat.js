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

chatSchema.index(
	{ 'participants.email': 1, 'lastMessage.timestamp': -1 },
	{ name: 'participants_email_lastMsgTimestamp' }
)

// 按最后消息时间单独索引（辅助排序）
chatSchema.index({ 'lastMessage.timestamp': -1 }, { name: 'lastMessage_timestamp' })

// 未读消息数查询索引（按需添加）
chatSchema.index(
	{ 'participants.email': 1, 'participants.unreadCount': 1 },
	{ name: 'email_unreadCount' }
)
const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const messageSchema = new Schema({
	chatId: { type: String, required: true },
	senderEmail: { type: String, required: true },
	content: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
	isRead: { type: Boolean, default: false }
})

messageSchema.index({ chatId: 1, timestamp: -1 })

// 未读消息查询优化
messageSchema.index({ chatId: 1, isRead: 1, timestamp: -1 })

// 同步消息的时间范围查询
messageSchema.index({ chatId: 1, timestamp: 1 })

const Message = mongoose.model('Message', messageSchema)

module.exports = Message

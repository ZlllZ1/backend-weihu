const mongoose = require('mongoose')
const Schema = mongoose.Schema

const blackListSchema = new Schema({
	userId: String,
	blackList: { type: Date, default: [] }
})

// 用户ID唯一索引（高频场景）
blackListSchema.index({ userId: 1 }, { unique: true })

// 黑名单数组多键索引（支持快速检查用户是否被拉黑）
blackListSchema.index({ blackList: 1 })

const BlackList = mongoose.model('BlackList', blackListSchema)

module.exports = BlackList

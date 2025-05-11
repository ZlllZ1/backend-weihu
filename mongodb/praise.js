const mongoose = require('mongoose')
const Schema = mongoose.Schema

const praiseSchema = new Schema({
	email: String,
	postId: String,
	praiseDate: { type: Date, default: Date.now }
})

// 用户查看点赞记录
praiseSchema.index({ email: 1, praiseDate: -1 })

// 唯一性约束：防止重复点赞 & 快速检查是否已赞
praiseSchema.index({ email: 1, postId: 1 }, { unique: true })

// 统计帖子点赞量
praiseSchema.index({ postId: 1 })

const Praise = mongoose.model('Praise', praiseSchema)

module.exports = Praise

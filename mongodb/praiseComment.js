const mongoose = require('mongoose')
const Schema = mongoose.Schema

const praiseCommentSchema = new Schema({
	email: String,
	commentId: String,
	praiseDate: { type: Date, default: Date.now }
})

// 用户查看点赞圈子列表
praiseCommentSchema.index({ email: 1, praiseDate: -1 })

// 唯一性约束：防止重复点赞
praiseCommentSchema.index({ email: 1, circleId: 1 }, { unique: true })

// 统计圈子点赞量（按需添加）
praiseCommentSchema.index({ circleId: 1 })

const PraiseComment = mongoose.model('PraiseComment', praiseCommentSchema)

module.exports = PraiseComment

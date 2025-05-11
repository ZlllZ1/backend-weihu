const mongoose = require('mongoose')
const Schema = mongoose.Schema

const praiseCircleSchema = new Schema({
	circleId: Number,
	email: String,
	praiseDate: { type: Date, default: Date.now }
})

// 用户查看点赞圈子列表
praiseCircleSchema.index({ email: 1, praiseDate: -1 })

// 唯一性约束：防止重复点赞
praiseCircleSchema.index({ email: 1, circleId: 1 }, { unique: true })

// 统计圈子点赞量（按需添加）
praiseCircleSchema.index({ circleId: 1 })

const PraiseCircle = mongoose.model('PraiseCircle', praiseCircleSchema)

module.exports = PraiseCircle

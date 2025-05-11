const mongoose = require('mongoose')
const Schema = mongoose.Schema

const circleSchema = new Schema({
	circleId: { type: Number, unique: true },
	email: String,
	publishDate: { type: Date, default: Date.now },
	area: String,
	delta: Object,
	content: String,
	praiseNum: { type: Number, default: 0 },
	commentNum: { type: Number, default: 0 },
	show: { type: Boolean, default: true },
	user: Object,
	replies: { type: Array, default: [] }
})
circleSchema.index({ email: 1, publishDate: -1 })

// 按地区 + 发布时间排序（地区内容展示）
circleSchema.index({ area: 1, publishDate: -1 })

// 按点赞数倒序（热门内容）
circleSchema.index({ praiseNum: -1 })

// 按评论数倒序（热门讨论）
circleSchema.index({ commentNum: -1 })

// 按发布时间倒序（全局最新内容）
circleSchema.index({ publishDate: -1 })

// 按显示状态过滤（可选，如果频繁查询 show=true/false）
circleSchema.index({ show: 1 })
const Circle = mongoose.model('Circle', circleSchema)

const initCounter = async (sequenceName, startValue = 0) => {
	const existingCounter = await mongoose.connection.db
		.collection('counters')
		.findOne({ _id: sequenceName })
	if (!existingCounter) {
		await mongoose.connection.db
			.collection('counters')
			.insertOne({ _id: sequenceName, sequence_value: startValue })
	}
}

const getNextSequenceValue = async sequenceName => {
	const sequenceDocument = await mongoose.connection.db
		.collection('counters')
		.findOneAndUpdate(
			{ _id: sequenceName },
			{ $inc: { sequence_value: 1 } },
			{ returnDocument: 'after' }
		)
	return sequenceDocument.sequence_value
}

const createCircle = async circleData => {
	await initCounter('circleId')
	const circle = new Circle(circleData)
	circle.circleId = await getNextSequenceValue('circleId')
	return circle.save()
}

module.exports = { Circle, createCircle }

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
	user: Object
})

circleSchema.index({ rate: -1 })
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

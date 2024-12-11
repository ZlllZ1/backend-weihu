const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const circleSchema = new Schema({
	circleId: String,
	email: String,
	publishDate: { type: Date, default: Date.now },
	area: String,
	content: String,
	praiseNum: Number,
	commentNum: Number
})

const Circle = mongoose.model('Circle', circleSchema)

module.exports = Circle

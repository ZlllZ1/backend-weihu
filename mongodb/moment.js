const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const momentSchema = new Schema({
	momentId: String,
	userId: String,
	publishDate: { type: Date, default: Date.now },
	area: String,
	content: String,
	praiseNum: Number,
	commentNum: Number
})

const Moment = mongoose.model('Moment', momentSchema)

module.exports = Moment

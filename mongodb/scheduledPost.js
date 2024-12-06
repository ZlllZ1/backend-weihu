const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const schedulePostSchema = new Schema({
	postId: { type: Number, unique: true },
	email: String,
	publishDate: { type: Date, default: Date.now },
	area: String,
	label: { type: String, default: '' },
	title: String,
	content: String,
	delta: Object,
	coverUrl: String,
	introduction: String,
	praiseNum: { type: Number, default: 0 },
	commentNum: { type: Number, default: 0 },
	collectNum: { type: Number, default: 0 },
	shareNum: { type: Number, default: 0 },
	lookNum: { type: Number, default: 0 },
	rate: { type: Number, default: 0 },
	user: Object
})

const ScheduledPost = mongoose.model('ScheduledPost', schedulePostSchema)

module.exports = ScheduledPost

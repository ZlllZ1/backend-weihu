const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const postSchema = new Schema({
	postId: String,
	userId: String,
	publishDate: { type: Date, default: Date.now },
	area: String,
	label: String,
	title: String,
	content: String,
	cover: String,
	praiseNum: Number,
	commentNum: Number,
	collectNum: Number,
	shareNum: Number,
	lookNum: Number,
	rate: Number
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post

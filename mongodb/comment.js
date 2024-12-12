const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const commentSchema = new Schema({
	commentId: String,
	parentId: { type: String, default: null },
	type: String,
	commentedId: String,
	postId: String,
	circleId: String,
	email: String,
	content: String,
	commentDate: { type: Date, default: Date.now }
})

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment

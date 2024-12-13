const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const praiseCommentSchema = new Schema({
	email: String,
	commentId: String,
	praiseDate: { type: Date, default: Date.now }
})

const PraiseComment = mongoose.model('PraiseComment', praiseCommentSchema)

module.exports = PraiseComment

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const circleCommentSchema = new Schema({
	circleId: String,
	circleEmail: String,
	parentId: String,
	content: String,
	parentEmail: String,
	user: {
		email: String,
		nickname: String,
		avatar: String,
		own: Boolean
	},
	parentUser: {
		email: String,
		nickname: String,
		avatar: String,
		own: Boolean
	},
	praiseDate: { type: Date, default: Date.now }
})

const CircleComment = mongoose.model('CircleComment', circleCommentSchema)

module.exports = CircleComment

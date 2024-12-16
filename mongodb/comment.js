const mongoose = require('mongoose')
const Schema = mongoose.Schema

const commentSchema = new Schema({
	parentId: { type: String, default: null },
	parentEmail: String,
	postId: String,
	postEmail: String,
	content: String,
	commentDate: { type: Date, default: Date.now },
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
	praiseNum: { type: Number, default: 0 },
	commentNum: { type: Number, default: 0 },
	rate: { type: Number, default: 0 }
})

commentSchema.pre('save', async function (next) {
	if (this.isNew) {
		try {
			const User = mongoose.model('User')
			const user = await User.findOne({ email: this.user.email }, 'nickname avatar')
			const parentUser = this.parentUser?.email
				? await User.findOne({ email: this.parentUser.email }, 'nickname avatar')
				: null
			if (user) {
				this.user.nickname = user.nickname
				this.user.avatar = user.avatar
				this.user.own = this.user.email === this.postEmail
			}
			if (parentUser) {
				this.parentUser.nickname = parentUser.nickname
				this.parentUser.avatar = parentUser.avatar
				this.parentUser.own = this.parentUser.email === this.postEmail
			}
		} catch (error) {
			console.error('Error fetching user info:', error)
		}
	}
	next()
})

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment

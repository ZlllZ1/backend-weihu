const mongoose = require('mongoose')
const Schema = mongoose.Schema

const circleCommentSchema = new Schema({
	circleId: Number,
	circleEmail: String,
	parentId: String,
	parentEmail: String,
	content: String,
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
	publishDate: { type: Date, default: Date.now }
})

circleCommentSchema.pre('save', async function (next) {
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

const CircleComment = mongoose.model('CircleComment', circleCommentSchema)

module.exports = CircleComment

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const circleCommentSchema = new Schema({
	circleId: Number,
	circleEmail: String,
	parentId: String,
	parentEmail: String,
	content: String,
	user: {
		_id: mongoose.Types.ObjectId,
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

// 1. 按圈子ID + 发布时间排序
circleCommentSchema.index({ circleId: 1, publishDate: -1 })

// 2. 按用户邮箱查询（用户个人中心展示评论）
circleCommentSchema.index({ 'user.email': 1 })

// 3. 按父评论ID查询（层级回复结构）
circleCommentSchema.index({ parentId: 1 })

// 4. 按被回复用户的邮箱查询（用户被提及的评论）
circleCommentSchema.index({ 'parentUser.email': 1 })

// 5. 按全局时间排序（可选，如果存在全站最新评论列表）
circleCommentSchema.index({ publishDate: -1 })

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
				this.user._id = user._id
			}
			if (parentUser) {
				this.parentUser.nickname = parentUser.nickname
				this.parentUser.avatar = parentUser.avatar
				this.parentUser.own = this.parentUser.email === this.postEmail
				this.parentUser._id = parentUser._id
			}
		} catch (error) {
			console.error('Error fetching user info:', error)
		}
	}
	next()
})

const CircleComment = mongoose.model('CircleComment', circleCommentSchema)

module.exports = CircleComment

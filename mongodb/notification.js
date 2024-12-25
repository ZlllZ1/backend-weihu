const { Schema, model } = require('mongoose')

const notificationSchema = new Schema(
	{
		recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		type: {
			type: String,
			required: true,
			enum: [
				'praise_post',
				'praise_comment',
				'praise_circle',
				'collect_post',
				'follow_user',
				'comment_post',
				'comment_circle',
				'comment_comment'
			],
			index: true
		},
		sender: {
			email: { type: String, required: true },
			nickname: { type: String, required: true },
			avatar: { type: String, required: true }
		},
		content: { type: String, required: true },
		relatedItem: {
			itemType: {
				type: String,
				required: true,
				enum: ['post', 'comment', 'circle', 'user'],
				index: true
			},
			itemId: { type: String, required: true, index: true },
			detail: {
				title: String,
				coverUrl: String,
				content: String,
				author: Object,
				postId: String,
				circleId: String,
				myContent: String
			}
		},
		isRead: { type: Boolean, default: false, index: true },
		createdAt: { type: Date, default: Date.now, index: true }
	},
	{ timestamps: true }
)

module.exports = model('Notification', notificationSchema)

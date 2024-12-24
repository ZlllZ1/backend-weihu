const mongoose = require('mongoose')
const Schema = mongoose.Schema

const notificationSchema = new Schema(
	{
		recipient: { type: String, ref: 'User', required: true },
		type: { type: String, required: true, enum: ['like', 'comment', 'follow', 'message'] },
		senderEmail: { type: String, required: true },
		content: { type: String, required: true },
		relatedItem: {
			itemType: {
				type: String,
				required: true,
				enum: ['chat', 'praise', 'comment', 'follow', 'collect']
			},
			itemId: { type: String, required: true }
		},
		isRead: { type: Boolean, default: false },
		createdAt: { type: Date, default: Date.now }
	},
	{ timestamps: true }
)
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, isRead: 1 })

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification

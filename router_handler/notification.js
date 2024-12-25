const Notification = require('../mongodb/notification')

const judgeNewNotification = async (req, res) => {
	const { userId } = req.body
	if (!userId) return res.sendError(400, 'userId is required')
	try {
		const hasNewNotification = await Notification.exists({ recipient: userId, isRead: false })
		if (hasNewNotification) return res.sendSuccess({ new: true })
		else return res.sendSuccess({ new: false })
	} catch (error) {
		console.error('Error in judgeNewNotification:', error)
		res.sendError(500, 'Internal server error')
	}
}

const calcNewNum = async (req, res) => {
	const { userId } = req.body
	if (!userId) return res.sendError(400, 'userId is required')
	try {
		const notifications = await Notification.aggregate([
			{ $match: { recipient: userId, isRead: false } },
			{
				$group: {
					_id: null,
					praiseNum: {
						$sum: {
							$cond: [{ $in: ['$type', ['praise_post', 'praise_circle', 'praise_comment']] }, 1, 0]
						}
					},
					collectNum: { $sum: { $cond: [{ $eq: ['$type', 'collect_post'] }, 1, 0] } },
					commentNum: {
						$sum: {
							$cond: [
								{ $in: ['$type', ['comment_post', 'comment_comment', 'comment_circle']] },
								1,
								0
							]
						}
					},
					followNum: { $sum: { $cond: [{ $eq: ['$type', 'follow_user'] }, 1, 0] } }
				}
			}
		])

		const result =
			notifications.length > 0
				? notifications[0]
				: { praiseNum: 0, collectNum: 0, commentNum: 0, followNum: 0 }
		return res.sendSuccess(result)
	} catch (error) {
		console.error('Error in calcNewNum:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getNotifications = async (req, res) => {
	const { userId, type } = req.query
	const page = parseInt(req.query.page) || 1
	const limit = parseInt(req.query.limit) || 10
	const skip = (page - 1) * limit
	if (!userId || !type) return res.sendError(400, 'userId and type are required')
	const typePrefixMap = {
		praise: ['praise_post', 'praise_circle', 'praise_comment'],
		collect: ['collect_post'],
		follow: ['follow_user'],
		comment: ['comment_post', 'comment_circle', 'comment_comment']
	}
	const types = typePrefixMap[type]
	if (!types) return res.sendError(400, 'Invalid type')
	try {
		const notifications = await Notification.find({
			recipient: userId,
			type: { $in: types }
		})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
		const total = await Notification.countDocuments({
			recipient: userId,
			type: { $in: types }
		})
		return res.sendSuccess({
			notifications,
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		})
	} catch (error) {
		console.error('Error in getNotifications:', error)
		res.sendError(500, 'Internal server error')
	}
}

const readNew = async (req, res) => {
	const { userId, type } = req.body
	if (!userId || !type) return res.sendError(400, 'userId and type are required')
	const typePrefixMap = {
		praise: ['praise_post', 'praise_comment', 'praise_circle'],
		collect: ['collect_post'],
		follow: ['follow_user'],
		comment: ['comment_post', 'comment_circle', 'comment_comment']
	}
	const types = typePrefixMap[type]
	if (!types) return res.sendError(400, 'Invalid type')
	try {
		const result = await Notification.updateMany(
			{
				recipient: userId,
				type: { $in: types },
				isRead: false
			},
			{ $set: { isRead: true } }
		)
		return res.sendSuccess({
			message: 'Notifications marked as read',
			modifiedCount: result.nModified
		})
	} catch (error) {
		console.error('Error in readNew:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	judgeNewNotification,
	calcNewNum,
	getNotifications,
	readNew
}

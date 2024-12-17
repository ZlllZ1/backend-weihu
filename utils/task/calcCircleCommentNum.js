const { Circle } = require('../../mongodb/circle')
const CircleComment = require('../../mongodb/circleComment')

const syncCircleCommentCount = async () => {
	try {
		const circles = await Circle.find({}, { circleId: 1 })
		const circleIds = circles.map(circle => circle.circleId)
		const commentCounts = await CircleComment.aggregate([
			{ $match: { circleId: { $in: circleIds } } },
			{
				$group: {
					_id: '$circleId',
					commentNum: { $sum: 1 }
				}
			}
		])
		const commentCountMap = new Map(commentCounts.map(item => [item._id, item.commentNum]))
		const bulkOps = circles.map(circle => ({
			updateOne: {
				filter: { circleId: circle.circleId },
				update: { $set: { commentNum: commentCountMap.get(circle.circleId) || 0 } },
				upsert: true
			}
		}))
		if (bulkOps.length > 0) await Circle.bulkWrite(bulkOps, { ordered: false })
	} catch (error) {
		console.error('同步朋友圈评论数量时出错:', error)
	}
}

module.exports = syncCircleCommentCount

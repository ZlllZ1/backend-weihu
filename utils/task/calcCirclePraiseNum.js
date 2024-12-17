const { Circle } = require('../../mongodb/circle')
const PraiseCircle = require('../../mongodb/praiseCircle')

const syncCirclePraiseCount = async () => {
	try {
		const circles = await Circle.find({}, { circleId: 1 })
		const circleIds = circles.map(circle => circle.circleId)
		const praiseCounts = await PraiseCircle.aggregate([
			{ $match: { circleId: { $in: circleIds } } },
			{
				$group: {
					_id: '$circleId',
					praiseNum: { $sum: 1 }
				}
			}
		])
		const praiseCountMap = new Map(praiseCounts.map(item => [item._id, item.praiseNum]))
		const bulkOps = circles.map(circle => ({
			updateOne: {
				filter: { circleId: circle.circleId },
				update: { $set: { praiseNum: praiseCountMap.get(circle.circleId) || 0 } },
				upsert: true
			}
		}))
		if (bulkOps.length > 0) await Circle.bulkWrite(bulkOps, { ordered: false })
	} catch (error) {
		console.error('同步朋友圈点赞数量时出错:', error)
	}
}

module.exports = syncCirclePraiseCount

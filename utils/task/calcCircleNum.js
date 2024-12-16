const User = require('../../mongodb/user.js')
const Circle = require('../../mongodb/circle.js')

const syncCircleCount = async () => {
	try {
		const users = await User.find({}, { email: 1, _id: 0 })
		const circleCounts = await Circle.aggregate([
			{
				$group: {
					_id: '$email',
					circleNum: { $sum: 1 }
				}
			}
		])
		const circleCountMap = new Map(circleCounts.map(item => [item._id, item.circleNum]))
		const bulkOps = users.map(user => ({
			updateOne: {
				filter: { email: user.email },
				update: { $set: { circleNum: circleCountMap.get(user.email) || 0 } }
			}
		}))
		if (bulkOps.length > 0) await User.bulkWrite(bulkOps)
	} catch (error) {
		console.error('同步朋友圈数量时出错:', error)
	}
}

module.exports = syncCircleCount

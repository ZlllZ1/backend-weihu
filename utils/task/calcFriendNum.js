const schedule = require('node-schedule')
const User = require('../../mongodb/user.js')
const { Friend } = require('../../mongodb/fan.js')

const syncFriendCount = async () => {
	try {
		const friendCounts = await Friend.aggregate([
			{
				$facet: {
					email1Counts: [{ $group: { _id: '$email1', count: { $sum: 1 } } }],
					email2Counts: [{ $group: { _id: '$email2', count: { $sum: 1 } } }]
				}
			},
			{ $project: { allCounts: { $concatArrays: ['$email1Counts', '$email2Counts'] } } },
			{ $unwind: '$allCounts' },
			{
				$group: {
					_id: '$allCounts._id',
					friendCount: { $sum: '$allCounts.count' }
				}
			}
		])
		const friendCountMap = new Map(friendCounts.map(item => [item._id, item.friendCount]))
		const allUsers = await User.find({}, { email: 1, _id: 0 })
		const bulkOps = allUsers.map(user => ({
			updateOne: {
				filter: { email: user.email },
				update: {
					$set: { friendNum: friendCountMap.get(user.email) || 0 }
				}
			}
		}))
		if (bulkOps.length > 0) await User.bulkWrite(bulkOps)
		console.log('更新好友')
	} catch (error) {
		console.error('同步好友数量时出错:', error)
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('0 0 * * *', syncFriendCount)
}

scheduleCalc()

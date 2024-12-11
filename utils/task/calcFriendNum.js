const schedule = require('node-schedule')
const User = require('../../mongodb/user.js')
const { Fan } = require('../../mongodb/fan.js')

const syncFriendCount = async () => {
	try {
		const friendCounts = await Fan.aggregate([
			{
				$group: {
					_id: null,
					pairs: { $push: { email1: '$email1', email2: '$email2' } }
				}
			},
			{
				$unwind: '$pairs'
			},
			{
				$group: {
					_id: '$pairs.email1',
					count: { $sum: 1 }
				}
			},
			{
				$unionWith: {
					coll: 'fans',
					pipeline: [
						{
							$group: {
								_id: '$email2',
								count: { $sum: 1 }
							}
						}
					]
				}
			},
			{
				$group: {
					_id: '$_id',
					friendCount: { $sum: '$count' }
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
	} catch (error) {
		console.error('同步好友数量时出错:', error)
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('0 0 * * *', syncFriendCount)
}

scheduleCalc()

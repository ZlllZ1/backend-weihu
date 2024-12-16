const User = require('../../mongodb/user.js')
const { Fan } = require('../../mongodb/fan.js')

const syncFollowCount = async () => {
	try {
		const allUsers = await User.find({}, { email: 1 })
		const followCounts = await Fan.aggregate([
			{
				$group: {
					_id: '$fanEmail',
					followNum: { $sum: 1 }
				}
			}
		])
		const followCountMap = new Map(followCounts.map(item => [item._id, item.followNum]))
		const bulkOps = allUsers.map(user => ({
			updateOne: {
				filter: { email: user.email },
				update: {
					$set: { followNum: followCountMap.get(user.email) || 0 }
				}
			}
		}))
		if (bulkOps.length > 0) await User.bulkWrite(bulkOps)
	} catch (error) {
		console.error('同步关注数时出错:', error)
	}
}

module.exports = syncFollowCount

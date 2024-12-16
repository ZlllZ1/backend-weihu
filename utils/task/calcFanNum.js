const User = require('../../mongodb/user.js')
const { Fan } = require('../../mongodb/fan.js')

const syncFanCount = async () => {
	try {
		const allUsers = await User.find({}, { email: 1 })
		const fanCounts = await Fan.aggregate([
			{
				$group: {
					_id: '$followedEmail',
					fanNum: { $sum: 1 }
				}
			}
		])
		const fanCountMap = new Map(fanCounts.map(item => [item._id, item.fanNum]))
		const bulkOps = allUsers.map(user => ({
			updateOne: {
				filter: { email: user.email },
				update: {
					$set: { fanNum: fanCountMap.get(user.email) || 0 }
				}
			}
		}))
		if (bulkOps.length > 0) await User.bulkWrite(bulkOps)
	} catch (error) {
		console.error('同步粉丝数时出错:', error)
	}
}

module.exports = syncFanCount

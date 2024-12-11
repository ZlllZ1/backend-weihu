const schedule = require('node-schedule')
const User = require('../../mongodb/user.js')
const Praise = require('../../mongodb/praise.js')

const syncPraiseCount = async () => {
	try {
		const allUsers = await User.find({}, { email: 1, _id: 0 })
		const praiseCounts = await Praise.aggregate([
			{
				$group: {
					_id: '$email',
					praiseNum: { $sum: 1 }
				}
			}
		])
		const praiseCountMap = new Map(praiseCounts.map(item => [item._id, item.praiseNum]))
		const bulkOps = allUsers.map(user => ({
			updateOne: {
				filter: { email: user.email },
				update: { $set: { praiseNum: praiseCountMap.get(user.email) || 0 } }
			}
		}))
		if (bulkOps.length > 0) await User.bulkWrite(bulkOps)
	} catch (error) {
		console.error('同步点赞数量时出错:', error)
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('0 0 * * *', syncPraiseCount)
}

scheduleCalc()

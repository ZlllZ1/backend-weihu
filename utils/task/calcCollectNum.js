const schedule = require('node-schedule')
const User = require('../../mongodb/user.js')
const Collect = require('../../mongodb/collect.js')

const syncCollectCount = async () => {
	try {
		const collectCounts = await Collect.aggregate([
			{
				$group: {
					_id: '$email',
					collectNum: { $sum: 1 }
				}
			}
		])
		const collectCountMap = new Map(collectCounts.map(item => [item._id, item.collectNum]))
		const users = await User.find({}, { email: 1, collectNum: 1 })
		const bulkOps = []
		for (const user of users) {
			const newCollectNum = collectCountMap.get(user.email) || 0
			if (user.collectNum !== newCollectNum) {
				bulkOps.push({
					updateOne: {
						filter: { email: user.email },
						update: { $set: { collectNum: newCollectNum } }
					}
				})
			}
		}
		if (bulkOps.length > 0) await User.bulkWrite(bulkOps)
	} catch (error) {
		console.error('同步收藏数量时出错:', error)
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('0 0 * * *', syncCollectCount)
}

scheduleCalc()

const schedule = require('node-schedule')
const User = require('../../mongodb/user.js')
const Collect = require('../../mongodb/collect.js')

const syncCollectCount = async () => {
	try {
		const users = await User.find({}, { email: 1, _id: 0 })
		const bulkOps = []
		for (const user of users) {
			const collectCount = await Collect.countDocuments({ email: user.email })
			bulkOps.push({
				updateOne: {
					filter: { email: user.email },
					update: { $set: { collectNum: collectCount } }
				}
			})
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

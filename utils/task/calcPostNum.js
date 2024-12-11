const schedule = require('node-schedule')
const { Post } = require('../../mongodb/post.js')
const User = require('../../mongodb/user.js')

const syncPostCount = async () => {
	try {
		const allUsers = await User.find({}, { email: 1 })
		const postNums = await Post.aggregate([
			{
				$group: {
					_id: '$email',
					postNum: { $sum: 1 }
				}
			}
		])
		const postNumMap = new Map(postNums.map(item => [item._id, item.postNum]))
		const bulkOps = allUsers.map(user => ({
			updateOne: {
				filter: { email: user.email },
				update: {
					$set: { postNum: postNumMap.get(user.email) || 0 }
				}
			}
		}))
		if (bulkOps.length > 0) await User.bulkWrite(bulkOps)
	} catch (error) {
		console.error('同步帖子数时出错:', error)
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('0 0 * * *', syncPostCount)
}

scheduleCalc()

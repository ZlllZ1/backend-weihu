const schedule = require('node-schedule')
const { Post } = require('../../mongodb/post.js')
const Collect = require('../../mongodb/collect.js')

const syncCollectCount = async () => {
	const posts = await Post.find(
		{},
		{
			_id: 0,
			postId: 1
		}
	)
	for (let post of posts) {
		const collectNum = await Collect.countDocuments({ postId: post.postId })
		await Post.findOneAndUpdate(
			{ postId: post.postId },
			{ $set: { collectNum: collectNum } },
			{ new: true }
		)
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('0 0 * * *', syncCollectCount)
}

scheduleCalc()

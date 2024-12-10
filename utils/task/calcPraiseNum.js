const schedule = require('node-schedule')
const { Post } = require('../../mongodb/post.js')
const Praise = require('../../mongodb/praise.js')

const syncPraiseCount = async () => {
	const posts = await Post.find(
		{},
		{
			_id: 0,
			postId: 1
		}
	)
	for (let post of posts) {
		const praiseNum = await Praise.countDocuments({ postId: post.postId })
		await Post.findOneAndUpdate(
			{ postId: post.postId },
			{ $set: { praiseNum: praiseNum } },
			{ new: true }
		)
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('0 0 * * *', syncPraiseCount)
}

scheduleCalc()

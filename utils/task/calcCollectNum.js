const schedule = require('node-schedule')
const { Post } = require('../../mongodb/post.js')
const Collect = require('../../mongodb/collect.js')

const syncCollectCount = async () => {
	const posts = await Post.find()
	for (let post of posts) {
		const collectNum = await Collect.countDocuments({ postId: post.postId })
		await Post.findByIdAndUpdate(post.postId, { collectNum })
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('* 1 * * *', syncCollectCount)
}

scheduleCalc()

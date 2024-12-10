const schedule = require('node-schedule')
const { Post } = require('../../mongodb/post.js')
const Praise = require('../../mongodb/praise.js')

const syncPraiseCount = async () => {
	const posts = await Post.find()
	for (let post of posts) {
		const praiseNum = await Praise.countDocuments({ postId: post.postId })
		await Post.findByIdAndUpdate(post.postId, { praiseNum })
	}
}

const scheduleCalc = () => {
	schedule.scheduleJob('* 1 * * *', syncPraiseCount)
}

scheduleCalc()

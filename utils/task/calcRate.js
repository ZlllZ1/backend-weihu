const schedule = require('node-schedule')
const Post = require('../../mongodb/post.js')

schedule.scheduleJob('0 * * * *', async () => {
	try {
		const posts = await Post.find({})
		for (const post of posts) {
			post.rate = post.praiseNum * 5 + post.commentNum * 2 + post.collectNum * 10 + post.lookNum
			await post.save()
		}
	} catch (error) {
		console.error('Error in updateRate:', error)
	}
})

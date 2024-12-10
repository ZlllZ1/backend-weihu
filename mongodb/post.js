const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const postSchema = new Schema({
	postId: { type: Number, unique: true },
	email: String,
	publishDate: { type: Date, default: Date.now },
	area: { type: String, default: '未知' },
	label: { type: String, default: '' },
	title: String,
	content: String,
	delta: Object,
	coverUrl: String,
	introduction: String,
	praiseNum: { type: Number, default: 0 },
	commentNum: { type: Number, default: 0 },
	collectNum: { type: Number, default: 0 },
	shareNum: { type: Number, default: 0 },
	lookNum: { type: Number, default: 0 },
	rate: { type: Number, default: 0 },
	user: Object
})
postSchema.index({ rate: -1 })
const Post = mongoose.model('Post', postSchema)

const initCounter = async (sequenceName, startValue = 0) => {
	const existingCounter = await mongoose.connection.db
		.collection('counters')
		.findOne({ _id: sequenceName })
	if (!existingCounter) {
		await mongoose.connection.db
			.collection('counters')
			.insertOne({ _id: sequenceName, sequence_value: startValue })
	}
}

const getNextSequenceValue = async sequenceName => {
	const sequenceDocument = await mongoose.connection.db
		.collection('counters')
		.findOneAndUpdate(
			{ _id: sequenceName },
			{ $inc: { sequence_value: 1 } },
			{ returnDocument: 'after' }
		)
	return sequenceDocument.sequence_value
}

const createPost = async postData => {
	await initCounter('postId')
	const post = new Post(postData)
	post.postId = await getNextSequenceValue('postId')
	return post.save()
}

module.exports = { Post, createPost }

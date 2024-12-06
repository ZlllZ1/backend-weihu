const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const draftsSchema = new Schema({
	draftId: String,
	userId: String,
	title: String,
	content: String,
	draftDate: { type: Date, default: Date.now },
	cover: String
})

const Drafts = mongoose.model('Drafts', draftsSchema)

module.exports = Drafts

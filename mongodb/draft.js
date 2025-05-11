const mongoose = require('mongoose')
const Schema = mongoose.Schema

const draftsSchema = new Schema({
	draftId: String,
	email: { type: String, default: '' },
	title: { type: String, default: '' },
	content: { type: String, default: '' },
	delta: Object,
	draftDate: { type: Date, default: Date.now },
	coverUrl: { type: String, default: '' },
	introduction: { type: String, default: '' }
})

draftsSchema.index({ email: 1, draftDate: -1 })
draftsSchema.index({ draftId: 1 }, { unique: true })
draftsSchema.index({ title: 'text', content: 'text' })

const Drafts = mongoose.model('Drafts', draftsSchema)

module.exports = Drafts

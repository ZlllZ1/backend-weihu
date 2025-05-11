const mongoose = require('mongoose')
const Schema = mongoose.Schema

const collectSchema = new Schema({
	email: String,
	postId: String,
	collectDate: { type: Date, default: Date.now }
})

collectSchema.index({ email: 1, collectDate: -1 })
collectSchema.index({ email: 1, postId: 1 }, { unique: true })

const Collect = mongoose.model('Collect', collectSchema)

module.exports = Collect

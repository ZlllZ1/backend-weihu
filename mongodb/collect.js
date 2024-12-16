const mongoose = require('mongoose')
const Schema = mongoose.Schema

const collectSchema = new Schema({
	email: String,
	postId: String,
	collectDate: { type: Date, default: Date.now }
})

const Collect = mongoose.model('Collect', collectSchema)

module.exports = Collect

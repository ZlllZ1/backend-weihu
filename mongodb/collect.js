const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const collectSchema = new Schema({
	userId: String,
	type: String,
	itemId: String,
	collectDate: { type: Date, default: Date.now },
	updateDate: { type: Date, default: Date.now }
})

const Collect = mongoose.model('Collect', collectSchema)

module.exports = Collect

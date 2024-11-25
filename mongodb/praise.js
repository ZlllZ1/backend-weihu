const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const praiseSchema = new Schema({
	userId: String,
	type: String,
	itemId: String,
	praiseDate: { type: Date, default: Date.now },
	updateDate: { type: Date, default: Date.now }
})

const Praise = mongoose.model('Praise', praiseSchema)

module.exports = Praise

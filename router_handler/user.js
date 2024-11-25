const User = require('../mongodb/user.js')
const bcrypt = require('bcrypt')
const ApiResponse = require('../utils/response.js')

exports.register = async (req, res) => {
	const { account, password } = req.body
	if (account.length < 9 || password.length < 12) {
		return res.status(400).send('account or password length too short')
	}
	try {
		const existingUser = await User.findOne({ account })
		if (existingUser) {
			return res.status(409).send('account already exists')
		} else {
			const hashedPassword = bcrypt.hashSync(password, 10)
			const newUser = new User({ account, password: hashedPassword })
			await newUser.save()
			return res.ApiResponse.success('register success')
		}
	} catch {
		return res.ApiResponse.error(500, 'server error')
	}
}

exports.login = (req, res) => {
	res.send('login OK')
}

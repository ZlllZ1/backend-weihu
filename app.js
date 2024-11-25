const express = require('express')
const cors = require('cors')
const { connectDb } = require('./mongodb/index.js')
const userRouter = require('./router/user')

connectDb()

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use('/api', userRouter)

app.listen(3007, () => {
	console.log('启动服务器 http://127.0.0.1:3007')
})

app.get('/', (req, res) => {
	res.send('hello world')
})

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const userRouter = require('./router/user')

const connectDb = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/main')
}
connectDb()

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use('/api', userRouter)

app.listen(3007, () => {
  console.log('启动服务器 http://127.0.0.1:3007')
})
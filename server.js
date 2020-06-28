require('dotenv').config()
const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const isBot = require('isbot-fast')
const db = require('./src/db.js')
const app = express()
app.use(bodyParser.json())

app.get('/img', function (req, res) {
    const ua = req.headers['user-agent'] || ''

    if (isBot(ua)) {
        res.end(ua)
    } else {
        res.end('not bot')
        // Making cookies
    }
})

db.put({ id: 'test' }, function (data) {
    console.log(data)
})

app.get('/:id', async function (req, res) {
    const data = await db.get(req.params.id)
    res.json(data)
})
app.post('/', async function (req, res) {
    const data = await db.put(req.body)
    res.json(data)
})
if (!process.env.LAMBDA_RUNTIME_DIR) {
    app.listen(3000)
}
//testdsdsddd
module.exports.handler = serverless(app)

const Twitter = require('twitter')
const fs = require('fs')
const ig = require('instagram-scraping')

const client = new Twitter({
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token_key: process.env.access_token_key,
    access_token_secret: process.env.access_token_secret,
})
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile('/tmp/' + path, 'utf8', function (err, data) {
            if (err) {
                resolve(null)
            }
            resolve(data)
        })
    })
}

const timeline = async (id) => {
    const cached = await readFile(id)
    return new Promise((resolve) => {
        if (cached) {
            resolve(JSON.parse(cached))
        } else {
            client.get('statuses/user_timeline', { screen_name: id }, function (
                error,
                tweets,
                response
            ) {
                if (!error) {
                    fs.writeFile(
                        '/tmp/' + id,
                        JSON.stringify(tweets),
                        function () {
                            resolve(tweets)
                        }
                    )
                } else {
                    resolve([])
                }
            })
        }
    })
}
const instaTimeline = (id) => {
    ig.scrapeUserPage(id).then((result) => {
        console.dir(result)
    })
}

module.exports = { timeline, instaTimeline }

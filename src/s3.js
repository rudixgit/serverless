const https = require('https')
const fs = require('fs')
const md5 = require('md5')
const request = require('request')

const download = (url, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream('/tmp/test.jpg'))
            .on('close', callback)
    })
}
const AWS = require('aws-sdk')
const { resolve } = require('path')
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'eu-central-1',
})

const uploadFile = (url) => {
    return new Promise((resolve, reject) => {
        download(url, function () {
            fs.readFile('/tmp/test.jpg', (err, data) => {
                s3.upload(
                    {
                        Bucket: 'img.rudixlab.com', // pass your bucket name
                        Key: md5(url) + '.jpg', // file will be saved as testBucket/contacts.csv
                        Body: data,
                        ContentType: 'image/jpeg',
                        ACL: 'public-read',
                    },
                    function (s3Err, data) {
                        if (s3Err) throw s3Err
                        resolve(data.Location)
                    }
                )
            })
        })
    })
}
const downloadFile = (id) => {
    return new Promise((resolve, reject) => {
        download(
            'https://s3.eu-central-1.amazonaws.com/img.rudixlab.com/' +
                id +
                '.jpg',
            function () {
                resolve()
            }
        )
    })
}

const getS3 = (id) => {
    return new Promise((resolve, reject) => {
        var s3Params = {
            Bucket: 'img.rudixlab.com',
            Key: id,
        }
        s3.getObject(s3Params, function (err, res) {
            if (err === null) {
                resolve(res)
            } else {
                console.log(err)
                resolve('404')
            }
        })
    })
}

module.exports = { uploadFile, downloadFile, getS3 }

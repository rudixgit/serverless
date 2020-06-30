/**
 * Implement Gatsby's Node APIs in this file
 *
 * See: https://wwwgatsbyjsorg/docs/node-apis/
 */
const path = require(`path`)
const _ = require('lodash')
const slugify = require('slugify')
const request = require('request')
const async = require('async')
const content =
    "this tutorial I want to show you how xxx to fetch data in React with Hooks by using the state and effect hooks We will use the widely xxx known Hacker News API to fetch popular articles from the tech world You will also implement xxx your custom hook for the data fetching that can be reused anywhere in your application or xxx published on npm as standalone node package Gatsby is renowned for its excellent documentation  xxx but what if the written word just isn't your learning style of choice? What if you have a xxx question that's best answered by a live human? What if you crave the rush that only comes xxx with the suspense of watching someone do a live coding demo? Gatsby is a free open-source xxx React-based framework for building fast websites and applications Gatsby streamlines the xxx setup and configuration of your build it can pull data into your UI from any and all xxx of your sources and amazing performance and current web best practices are built into xxx Gatsby sites Deep Learning has changed the game in speech recognition with the introduction xxx of end-to-end models These models take in audio and directly output transcriptions xxx Two of the most popular end-to-end models today are Deep Speech by Baidu and xxx Listen Attend Spell (LAS) by Google Both Deep Speech and LAS are recurrent neural network xxx (RNN) based architectures with different approaches to modeling speech recognition Deep xxx Speech uses the Connectionist Temporal Classification (CTC) loss function to predict the xxx speech transcript LAS uses a sequence to sequence network architecture for its predictions xxx The optimizer and learning rate schedule plays a very important role in getting our model xxx to converge to the best point Picking the right optimizer and scheduler can also save xxx you compute time and help your model generalize better to real-world use cases For our xxx model be using AdamW with the One Cycle Learning Rate Scheduler Adam is a widely used xxx optimizer that helps your model converge quicker therefore saving compute time but xxx has been notorious for not generalizing as well as Stochastic Gradient Descent AKA SGD xxx Our model defined above output characters Some benefits to that are the model doesn't xxx have to worry about out of vocabulary words when running inference on speech So for the word xxx chat each character has is its own label The downside to using characters are inefficiency xxx and the model being prone to more errors because you're predicting one character at a xxx time Using the whole word as labels have been explored to some degree of success Using xxx this method the entire word chat would be the label But using whole words you would xxx have to keep an index of all possible vocabularies to make a prediction which is xxx memory inefficient with the possibility of running into out of vocabulary words during xxx prediction The sweet spot would be using word piece or sub-word units as labels Instead xxx of characters for the individual label you can chop up the words into sub-word units xxx and use those as labels ie ch at This solves the out of vocabulary issue and is much more xxx efficient as it needs fewer steps to decode then using characters and without the need xxx to have an index of all possible words Word pieces have been used successfully with many xxx NLP models like BERT and would work naturall with speech recognition problems as well xxx At the company I work at one of our products is an embeddable commenting system Unlike xxx single-page applications when we encounter bugs they’re usually on the client’s xxx website This raised the question how can we embed a piece of code that will run on all xxx our client’s websites that will help us debug and improve our overall build experience xxx If that’s not working for you (say you passed the 1000 LOCs and things get a bit xxx spaghetti-y) you can try webpack-userscript Configure and run it it will start a Webpack xxx dev server serving your userscript locally You can then split your code up into modules xxx use all your favorite NPM packages and all the great things that come with using a xxx bundler That's if for the implicit programmatic data fetching with the effect hook You xxx can decide on which state the effect depends Once you set this state on a click or in xxx another side-effect this effect will run again In this case if the URL state changes xxx the effect runs again to fetch stories from the API"
const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}
function randomize(content, keyword) {
    const x = _.chunk(
        _.shuffle(content.toLowerCase().replace(/xxx/g, keyword).split(' ')),
        20
    ).slice(0, 5)

    const arr = _.flatten(
        x.map((item, i1) =>
            item.map((itemx, i) => {
                if (i === 0 && i1 !== 0) {
                    return '. ' + capitalize(itemx)
                } else {
                    return itemx
                }
            })
        )
    ).join(' ')
    return arr
}

const db = require('../src/db.js')

const go = (star) => {
    request.get(
        'http://192.168.1.101:5984/twitter/_design/api/_view/users?reduce=true&group=true&limit=1000&start_key="' +
            star +
            '"',
        function (x, v, body) {
            const arr = JSON.parse(body).rows
            const last = arr.reverse()[0].key

            async.eachLimit(
                arr,
                300,
                async function (element, callback) {
                    await db.put({ id: element.key, type: 't' })

                    callback()
                },
                function (err) {
                    console.log(last)
                    go(last)
                }
            )
        }
    )
}

go('_')

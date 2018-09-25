
# [wenodejs](https://github.com/WeYouMe/wenodejs) [![Build Status](https://img.shields.io/circleci/project/github/WeYouMe/wenodejs.svg?style=flat-square)](https://circleci.com/gh/WeYouMe/workflows/wenodejs) [![Coverage Status](https://img.shields.io/coveralls/WeYouMe/wenodejs.svg?style=flat-square)](https://coveralls.io/github/WeYouMe/wenodejs?branch=master) [![Package Version](https://img.shields.io/npm/v/wenodejs.svg?style=flat-square)](https://www.npmjs.com/package/wenodejs)

Robust [WeYouMe blockchain](https://WeYouMe.io) client library that runs in both node.js and the browser.

* [Demo](https://comments.steem.vc) ([source](https://github.com/WeYouMe/wenodejs/tree/master/examples/comment-feed))
* [Code playground](https://playground.steem.vc)
* [Documentation](https://WeYouMe.github.io/wenodejs/)
* [Bug tracker](https://github.com/WeYouMe/wenodejs/issues)

---

**note** As of version 0.7.0 WebSocket support has been removed. The only transport provided now is HTTP(2). For most users the only change required is to swap `wss://` to `https://` in the address. If you run your own full node make sure to set the proper [CORS headers](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) if you plan to access it from a browser.

---


Browser compatibility
---------------------

[![Build Status](https://saucelabs.com/browser-matrix/WeYouMe-wenodejs.svg)](https://saucelabs.com/open_sauce/user/WeYouMe-wenodejs)


Installation
------------

### Via npm

For node.js or the browser with [browserify](https://github.com/substack/node-browserify) or [webpack](https://github.com/webpack/webpack).

```
npm install wenodejs
```

### From cdn or self-hosted script

Grab `dist/wenodejs` from a [release](https://github.com/WeYouMe/wenodejs/releases) and include in your html:

```html
<script src="wenodejs"></script>
```

Or from the [unpkg](https://unpkg.com) cdn:

```html
<script src="https://unpkg.com/wenodejs@^0.8.0/dist/wenodejs"></script>
```

Make sure to set the version you want when including from the cdn, you can also use `wenodejs@latest` but that is not always desirable. See [unpkg.com](https://unpkg.com) for more information.


Usage
-----

### In the browser

```html
<script src="https://unpkg.com/wenodejs@latest/dist/wenodejs"></script>
<script>
    var client = new wenodejs.Client('https://api.WeYouMe.io')
    client.database.getDiscussions('trending', {tag: 'writing', limit: 1}).then(function(discussions){
        document.body.innerHTML += '<h1>' + discussions[0].title + '</h1>'
        document.body.innerHTML += '<h2>by ' + discussions[0].author + '</h2>'
        document.body.innerHTML += '<pre style="white-space: pre-wrap">' + discussions[0].body + '</pre>'
    })
</script>
```

See the [demo source](https://github.com/WeYouMe/wenodejs/tree/master/examples/comment-feed) for an example on how to setup a livereloading TypeScript pipeline with [wintersmith](https://github.com/WeYouMe/wintersmith) and [browserify](https://github.com/substack/node-browserify).

### In node.js

With TypeScript:

```typescript
import {Client} from 'wenodejs'

const client = new Client('https://api.WeYouMe.io')

for await (const block of client.blockchain.getBlocks()) {
    console.log(`New block, id: ${ block.block_id }`)
}
```

With JavaScript:

```javascript
var wenodejs = require('wenodejs')

var client = new wenodejs.Client('https://api.WeYouMe.io')
var key = wenodejs.PrivateKey.fromLogin('username', 'password', 'posting')

client.broadcast.vote({
    voter: 'username',
    author: 'almost-digital',
    permlink: 'wenodejs-is-the-best',
    weight: 10000
}, key).then(function(result){
   console.log('Included in block: ' + result.block_num)
}, function(error) {
   console.error(error)
})
```

With ES2016 (node.js 7+):

```javascript
const {Client} = require('wenodejs')

const client = new Client('https://api.WeYouMe.io')

async function main() {
    const props = await client.database.getChainProperties()
    console.log(`Maximum blocksize consensus: ${ props.maximum_block_size } bytes`)
    client.disconnect()
}

main().catch(console.error)
```

With node.js streams:

```javascript
var wenodejs = require('wenodejs')
var es = require('event-stream') // npm install event-stream
var util = require('util')

var client = new wenodejs.Client('https://api.WeYouMe.io')

var stream = client.blockchain.getBlockStream()

stream.pipe(es.map(function(block, callback) {
    callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')
})).pipe(process.stdout)
```


Bundling
--------

The easiest way to bundle wenodejs (with browserify, webpack etc.) is to just `npm install wenodejs` and `require('wenodejs')` which will give you well-tested (see browser compatibility matrix above) pre-bundled code guaranteed to JustWork™. However, that is not always desirable since it will not allow your bundler to de-duplicate any shared dependencies wenodejs and your app might have.

To allow for deduplication you can `require('wenodejs/lib/index-browser')`, or if you plan to provide your own polyfills: `require('wenodejs/lib/index')`. See `src/index-browser.ts` for a list of polyfills expected.

---

*Share and Enjoy!*

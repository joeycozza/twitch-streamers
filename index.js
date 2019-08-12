const _ = require('lodash')
const axios = require('axios')
const delay = require('util').promisify(setTimeout)

// TODO: JOEY get input for min and max number of current viewers

const token = 't6fn7nqdq0cpjmzjt52u28duznl1nx'
const baseUrl = 'https://api.twitch.tv/helix/streams'
const minViewers = 80
const maxViewers = 120

const options = {
  method: 'GET',
  url: baseUrl,
  headers: {
    'Client-ID': token,
  },
  params: {
    language: 'en',
    first: 100,
  },
}

/*_.last(allStreams):  { 
  id: '35260656240',
  user_id: '114486316',
  user_name: 'DomeZ',
  game_id: '459382',
  type: 'live',
  title: '100+ Kill Attempts | INTERACTIVE STREAM | !Sub !Prime',
  viewer_count: 70,
  started_at: '2019-08-12T00:18:33Z',
  language: 'en',
  thumbnail_url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_domez-{width}x{height}.jpg',
  tag_ids: [ '6ea6bca4-4712-4ab9-a906-e3336a9d8039' ] }
*/
main()
async function main() {
  const allStreams = await getAllStreams()
  console.log('_.last(allStreams): ', _.last(allStreams))
  console.log('allStreams.length: ', allStreams.length)
  const smallStreams = _.filter(allStreams, ({ viewer_count }) => {
    return viewer_count >= minViewers && viewer_count <= maxViewers
  })

  console.log('smallStreams.length: ', smallStreams.length)
  /*
   Username
Current game
Current viewer count
Total Views
Followers
    */

}

async function getUserInfo(id) {
  const res = await axios()
}


async function getAllStreams(cursor = '', allStreams = [], count = 0) {
  console.log('count: ', count)
  if (count === 100) {
    console.log('Got 10,000 streams...bailing now...')
    return allStreams
  }
  try {
    if (cursor) {
      options.url = `${baseUrl}?after=${cursor}`
    }
    const res = await axios(options)
    await delayIfRateLimited(res.headers)
    const { pagination, data } = res.data
    allStreams.push(...data)
    if (_.last(data).viewer_count < minViewers) {
      return allStreams
    }
    if (pagination.cursor) {
      return getAllStreams(pagination.cursor, allStreams, count + 1)
    }
    return allStreams
  } catch (err) {
    console.log('err: ', err)
  }
}

async function delayIfRateLimited(headers) {
  if (headers['ratelimit-remaining'] <= 3) {
    const millisecondsToWait = headers['ratelimit-reset'] * 1000 - Date.now()
    console.log(`Hit our rate limit, waiting for ${millisecondsToWait/1000} seconds for limit to reset`)
    await delay(millisecondsToWait)
  }
}

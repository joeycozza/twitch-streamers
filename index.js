const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const delay = require('util').promisify(setTimeout)
const { parse } = require('json2csv')

// TODO: JOEY get input for min and max number of current viewers
// TODO: JOEY get name of output file

const token = 't6fn7nqdq0cpjmzjt52u28duznl1nx'
const baseURL = 'https://api.twitch.tv/helix'
const maxViewers = 101
const minViewers = 97

const options = {
  method: 'GET',
  baseURL,
  headers: {
    'Client-ID': token,
  },
  params: {
    language: 'en',
    first: 100,
  },
}

main()
async function main() {
  try {
    const allStreams = await getAllStreams()
    console.log('allStreams.length: ', allStreams.length)
    const smallStreams = _.filter(allStreams, ({ viewer_count }) => {
      return viewer_count >= minViewers && viewer_count <= maxViewers
    })

    console.log('smallStreams.length: ', smallStreams.length)
    const allUserIds = _.map(smallStreams, 'user_id')
    const allGameIds = _.uniq(_.map(smallStreams, 'game_id'))

    const allUserInfo = await getInfoByIds(allUserIds, 'users')
    const allGameInfo = await getInfoByIds(allGameIds, 'games')
    const followerCounts = await getFollowerCounts(allUserIds)

    const csvData = _.map(smallStreams, stream => {
      const user = _.find(allUserInfo, { id: stream.user_id })
      const game = _.find(allGameInfo, { id: stream.game_id })
      const followers = _.find(followerCounts, { userId: stream.user_id })

      return {
        name: user.display_name,
        currentGame: game && game.name,
        currentViewerCount: stream.viewer_count,
        totalViews: user.view_count,
        totalFollowers: followers.total,
        broadcasterType: user.broadcaster_type,
      }
    })

    const csv = parse(csvData)
    console.log(csv)
    fs.writeFileSync(path.join(process.cwd(), 'mycsv.csv'), csv)
    // TODO: JOEY output to csv file
  } catch (err) {
    console.log('err: ', err)
  }
}

async function getFollowerCounts(allUserIds) {
  options.url = 'users/follows'
  const followerCounts = []

  for (const userId of allUserIds) {
    options.params = { first: 1, to_id: userId }
    const { data, headers } = await axios(options)
    await delayIfRateLimited(headers)
    followerCounts.push({ userId, total: data.total })
  }

  return followerCounts
}

/**
 * Gets the user info for all the ids given to it, we can group it by 100 ids, and get info for 100
 * users in a single request, so we iterate over each 100 ids
 */
async function getInfoByIds(allIds, endpoint) {
  options.url = endpoint
  const groupsOf100 = _.chunk(allIds, 100)

  const allData = []
  for (const group of groupsOf100) {
    options.params.id = group
    const { data, headers } = await axios(options)
    allData.push(...data.data)
    await delayIfRateLimited(headers)
  }
  return allData
}

/**
 * This will paginate through all streams and stop paginating after the viewer count is lower than the minimum we care about
 */
async function getAllStreams(cursor = '', allStreams = [], count = 0) {
  options.url = `streams`
  console.log('count: ', count)
  if (count === 100) {
    console.log('Got 10,000 total streams...bailing now...')
    return allStreams
  }
  if (cursor) {
    options.params.after = cursor
  }
  const res = await axios(options)
  await delayIfRateLimited(res.headers)
  const { pagination, data } = res.data
  allStreams.push(...data)
  //bail once the viewer count gets too low on the returned streams
  if (_.last(data).viewer_count < minViewers) {
    return allStreams
  }
  if (pagination.cursor) {
    return getAllStreams(pagination.cursor, allStreams, count + 1)
  }
  return allStreams
}

async function delayIfRateLimited(headers) {
  if (headers['ratelimit-remaining'] <= 1) {
    const millisecondsToWait = headers['ratelimit-reset'] * 1000 - Date.now()
    console.log(
      `Hit our rate limit, waiting for ${millisecondsToWait / 1000} seconds for limit to reset`
    )
    await delay(millisecondsToWait)
  }
}

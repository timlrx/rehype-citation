//@ts-nocheck
import syncFetch from 'sync-fetch'
import 'isomorphic-fetch'
import logger from '../logger.js'
// import pkg from '../../package.json';
const corsEnabled = typeof location !== 'undefined' && typeof document !== 'undefined'
let userAgent = `Citation.js/0.5`

function normaliseHeaders(headers) {
  const result = {}
  const entries =
    headers instanceof Headers || headers instanceof syncFetch.Headers
      ? Array.from(headers)
      : Object.entries(headers)

  for (const [name, header] of entries) {
    result[name.toLowerCase()] = header.toString()
  }

  return result
}

function parseOpts(opts = {}) {
  const reqOpts = {
    headers: {
      accept: '*/*',
    },
    method: 'GET',
    checkContentType: opts.checkContentType,
  }

  if (userAgent && !corsEnabled) {
    reqOpts.headers['user-agent'] = userAgent
  }

  if (opts.body) {
    reqOpts.method = 'POST'
    const isJson = typeof opts.body !== 'string'
    reqOpts.body = isJson ? JSON.stringify(opts.body) : opts.body
    reqOpts.headers['content-type'] = isJson ? 'application/json' : 'text/plain'
  }

  if (opts.headers) {
    Object.assign(reqOpts.headers, normaliseHeaders(opts.headers))
  }

  return reqOpts
}

function sameType(request, response) {
  if (!request.accept || request.accept === '*/*' || !response['content-type']) {
    return true
  }

  const [a, b] = response['content-type'].split(';')[0].trim().split('/')
  return request.accept
    .split(',')
    .map((type) => type.split(';')[0].trim().split('/'))
    .some(([c, d]) => (c === a || c === '*') && (d === b || d === '*'))
}

function checkResponse(response, opts) {
  const { status, headers } = response
  let error

  if (status >= 400) {
    error = new Error(`Server responded with status code ${status}`)
  } else if (opts.checkContentType === true && !sameType(opts.headers, normaliseHeaders(headers))) {
    error = new Error(`Server responded with content-type ${headers.get('content-type')}`)
  }

  if (error) {
    error.status = status
    error.headers = headers
    error.body = response.body
    throw error
  }

  return response
}

export function fetchFile(url, opts) {
  const reqOpts = parseOpts(opts)
  logger.http('[core]', reqOpts.method, url, reqOpts)
  const response = checkResponse(syncFetch(url, reqOpts), reqOpts)
  return response.text()
}
export async function fetchFileAsync(url, opts) {
  const reqOpts = parseOpts(opts)
  logger.http('[core]', reqOpts.method, url, reqOpts)
  return fetch(url, reqOpts)
    .then((response) => checkResponse(response, reqOpts))
    .then((response) => response.text())
}
export function setUserAgent(newUserAgent) {
  userAgent = newUserAgent
}
export default fetchFile

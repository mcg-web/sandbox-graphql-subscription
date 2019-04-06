import {ApolloLink, Observable} from 'apollo-link'
import { EventSourcePolyfill } from 'event-source-polyfill'
import {print} from 'graphql/language/printer'
import isString from 'lodash.isstring'
import isObject from 'lodash.isobject'

export class SubscriptionClient {
  constructor(url, hubUrl, httpOptions) {
    this.httpOptions = httpOptions
    this.url = url
    this.hubUrl = hubUrl
    this.subscriptions = {}
    this.cache = {}
  }

  static payloadCacheKey(payload, header) {
    return JSON.stringify({payload, header});
  }

  start(payload, headers, timeout) {
    const cacheKey = SubscriptionClient.payloadCacheKey(payload, headers);
    this.cache[cacheKey] = this.cache.hasOwnProperty(cacheKey) ? this.cache[cacheKey] : fetch(this.url, {
      method: 'POST',
      headers: Object.assign({}, headers, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ type: 'start', payload}),
      timeout: timeout
    }).then(res => res.json())

    return this.cache[cacheKey]
  }

  subscribe(options, handler) {
    let httpOptions =
      typeof this.httpOptions === 'function'
        ? this.httpOptions()
        : this.httpOptions
    httpOptions = Object.assign({
      headers: {}, timeout: 1000, heartbeatTimeout: 300000
    }, httpOptions)
    const {timeout, headers, heartbeatTimeout} = httpOptions
    const {query, variables, operationName} = options
    if (!query) throw new Error('Must provide `query` to subscribe.')
    if (!handler) throw new Error('Must provide `handler` to subscribe.')
    if (
      (operationName && !isString(operationName)) ||
      (variables && !isObject(variables))
    )
      throw new Error(
        'Incorrect option types to subscribe. `operationName` must be a string, and `variables` must be an object.'
      )
    const payload = {query, variables, operationName};

    return this.start(payload, headers, timeout)
      .then(data => {
        // todo manage error type
        if (data.type === 'data') {
          const subId = data.extensions.id
          const url = new URL(this.hubUrl)
          url.searchParams.append('topic', data.extensions.topic)
          const evtSource = new EventSourcePolyfill(
            url.href, {heartbeatTimeout, headers: { Authorization: `Bearer ${data.extensions.token}`}}
          )
          this.subscriptions[subId] = {options, handler, evtSource}

          evtSource.onmessage = e => {
            const message = JSON.parse(e.data)
            switch (message.type) {
              case 'data':
                this.subscriptions[subId].handler(message.payload.data)
                break
              default:
              case 'ka':
                break
            }

            evtSource.onerror = e => {
              console.error(
                `EventSource connection failed for subscription ID: ${subId}. Retry.`
              )
              if (
                this.subscriptions[subId] &&
                this.subscriptions[subId].evtSource
              ) {
                this.subscriptions[subId].evtSource.close()
              }
              delete this.subscriptions[subId]
              const retryTimeout = setTimeout(() => {
                this.subscribe(options, handler)
                clearTimeout(retryTimeout)
              }, 1000)
            }
          }
          return subId
        }
      })
      .catch(error => {
        console.error(`${error.message}. Subscription failed. Retry.`)
        delete this.cache[SubscriptionClient.payloadCacheKey(payload, headers)]
        const retryTimeout = setTimeout(() => {
          this.subscribe(options, handler)
          clearTimeout(retryTimeout)
        }, 1000)
      })
  }

  unsubscribe(subscription) {
    Promise.resolve(subscription).then(subId => {
      // TODO: unsubscribe from backend too?
      if (this.subscriptions[subId] && this.subscriptions[subId].evtSource) {
        this.subscriptions[subId].evtSource.close()
      }
      delete this.subscriptions[subId]
    })
  }

  unsubscribeAll() {
    Object.keys(this.subscriptions).forEach(subId => {
      this.unsubscribe(subId)
    })
  }
}

export class SSELink extends ApolloLink {
  constructor(paramsOrClient) {
    super()
    this.subscriptionClient = paramsOrClient
  }

  request(operation) {
    return new Observable(observer => {
      const subscription = this.subscriptionClient.subscribe(
        Object.assign(operation, {query: print(operation.query)}),
        data => observer.next({data})
      )

      return () => this.subscriptionClient.unsubscribe(subscription)
    })
  }
}

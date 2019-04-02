import {ApolloLink, Observable} from 'apollo-link';
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
import {print} from 'graphql/language/printer';
import isString from 'lodash.isstring';
import isObject from 'lodash.isobject';

export class SubscriptionClient {
  constructor(url, hubUrl, httpOptions) {
    this.httpOptions = httpOptions||{"timeout": 1000, "headers": {}};
    this.url = url;
    this.hubUrl = hubUrl;
    this.subscriptions = {};
  }

  subscribe(options, handler) {
    const {timeout, headers} =
      typeof this.httpOptions === 'function'
        ? this.httpOptions()
        : this.httpOptions;

    const {query, variables, operationName} = options;
    if (!query) throw new Error('Must provide `query` to subscribe.');
    if (!handler) throw new Error('Must provide `handler` to subscribe.');
    if (
      (operationName && !isString(operationName)) ||
      (variables && !isObject(variables))
    )
      throw new Error(
        'Incorrect option types to subscribe. `operationName` must be a string, and `variables` must be an object.'
      );

    return fetch(this.url, {
      method: 'POST',
      headers: Object.assign({}, headers, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ type: 'start', payload: {query, variables, operationName}}),
      timeout: timeout || 1000
    })
      .then(res => res.json())
      .then(data => {
        if (data.type === 'data') {
          const subId = data.extensions.id;
          const url = new URL(this.hubUrl);
          url.searchParams.append('topic', data.extensions.topic);
          const evtSource = new EventSourcePolyfill(
            url.href, {headers: { Authorization: `Bearer ${data.extensions.token}`}}
          );
          this.subscriptions[subId] = {options, handler, evtSource};

          evtSource.onmessage = e => {
            const message = JSON.parse(e.data);
            switch (message.type) {
              case 'data':
                this.subscriptions[subId].handler(message.payload.data);
                break;
              case 'ka':
                break;
            }

            evtSource.onerror = e => {
              console.error(
                `EventSource connection failed for subscription ID: ${subId}. Retry.`
              );
              if (
                this.subscriptions[subId] &&
                this.subscriptions[subId].evtSource
              ) {
                this.subscriptions[subId].evtSource.close();
              }
              delete this.subscriptions[subId];
              const retryTimeout = setTimeout(() => {
                this.subscribe(options, handler);
                clearTimeout(retryTimeout);
              }, 1000);
            };
          };
          return subId;
        }
      })
      .catch(error => {
        console.error(`${error.message}. Subscription failed. Retry.`);
        const retryTimeout = setTimeout(() => {
          this.subscribe(options, handler);
          clearTimeout(retryTimeout);
        }, 1000);
      });
  }

  unsubscribe(subscription) {
    Promise.resolve(subscription).then(subId => {
      if (this.subscriptions[subId] && this.subscriptions[subId].evtSource) {
        this.subscriptions[subId].evtSource.close();
      }
      delete this.subscriptions[subId];
    });
  }

  unsubscribeAll() {
    Object.keys(this.subscriptions).forEach(subId => {
      this.unsubscribe(parseInt(subId));
    });
  }
}

export class SSELink extends ApolloLink {
  constructor(paramsOrClient) {
    super();
    this.subscriptionClient = paramsOrClient;
  }

  request(operation) {
    return new Observable(observer => {
      const subscription = this.subscriptionClient.subscribe(
        Object.assign(operation, {query: print(operation.query)}),
        data => observer.next({data})
      );

      return () => this.subscriptionClient.unsubscribe(subscription);
    });
  }
}

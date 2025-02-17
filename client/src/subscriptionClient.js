import { ApolloLink, Observable } from "apollo-link";
import { EventSourcePolyfill } from "event-source-polyfill";
import { print } from "graphql/language/printer";
import isString from "lodash.isstring";
import isObject from "lodash.isobject";

export class SubscriptionClient {
  constructor(uri, hubUri, httpOptions) {
    this.httpOptions = httpOptions;
    this.uri = uri;
    this.hubUri = hubUri;
    this.subscriptions = {};
    this.lastEventIDs = {};
    this.eventPromises = {};
  }

  subscribe(options, handler) {
    let httpOptions =
      typeof this.httpOptions === "function"
        ? this.httpOptions()
        : this.httpOptions;
    httpOptions = Object.assign(
      {
        headers: {},
        evtSourceHeaders: {},
        timeout: 1000,
        heartbeatTimeout: 300000
      },
      httpOptions
    );
    const {
      timeout,
      headers,
      heartbeatTimeout,
      evtSourceHeaders
    } = httpOptions;
    const { query, variables, operationName } = options;
    if (!query) throw new Error("Must provide `query` to subscribe.");
    if (!handler) throw new Error("Must provide `handler` to subscribe.");
    if (
      (operationName && !isString(operationName)) ||
      (variables && !isObject(variables))
    )
      throw new Error(
        "Incorrect option types to subscribe. `operationName` must be a string, and `variables` must be an object."
      );
    const payload = { query, variables, operationName };
    const eventKey = JSON.stringify({ payload, headers });

    if (!this.eventPromises[eventKey]) {
      this.eventPromises[eventKey] = fetch(this.uri, {
        method: "POST",
        headers: Object.assign({}, headers, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ type: "start", payload }),
        timeout: timeout
      })
        .then(res => res.json());
    }

    return this.eventPromises[eventKey]
      .then(payload => {
        if (payload.extensions['__sse']) {
          const sseExtension = payload.extensions['__sse'];
          const subId = sseExtension.id;
          let hubUri = sseExtension.hubUrl;
          if (this.hubUri) {
            const uri = new URL(this.hubUri);
            uri.searchParams.append("topic", sseExtension.topic);
            hubUri = uri.href;
          }
          if (this.lastEventIDs[eventKey]) {
            hubUri =
              hubUri + "&Last-Event-ID=" + this.lastEventIDs[eventKey];
          }

          if (sseExtension.accessToken) {
            Object.assign(evtSourceHeaders, {
              Authorization: `Bearer ${sseExtension.accessToken}`
            });
          }
          const evtSource = new EventSourcePolyfill(hubUri, {
            heartbeatTimeout,
            headers: evtSourceHeaders
          });
          this.subscriptions[subId] = { options, handler, evtSource };

          evtSource.onmessage = e => {
            this.lastEventIDs[eventKey] = e.lastEventId;
            const message = JSON.parse(e.data);
            switch (message.type) {
              case "data":
                this.subscriptions[subId].handler(message.payload.data);
                break;
              default:
              case "ka":
                break;
            }

            evtSource.onerror = e => {
              console.error(
                `EventSource connection failed for subscription ID: ${subId}. Retry.`
              );
              this.stop(subId);
              const retryTimeout = setTimeout(() => {
                this.subscribe(options, handler);
                clearTimeout(retryTimeout);
              }, 1000);
            };
          };
          return subId;
        } else if (payload.errors) {
          console.error(
            `Subscription start failed with error payload: ${JSON.stringify(
              payload
            )}.`
          );
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
      this.stop(subId);
    });
  }

  stop(subId) {
    // TODO: unsubscribe from backend too?
    if (this.subscriptions[subId] && this.subscriptions[subId].evtSource) {
      this.subscriptions[subId].evtSource.close();
    }
    delete this.subscriptions[subId];
  }

  unsubscribeAll() {
    Object.keys(this.subscriptions).forEach(subId => {
      this.unsubscribe(subId);
    });
  }
}

export class SSELink extends ApolloLink {
  constructor(paramsOrClient) {
    super();
    if (paramsOrClient instanceof SubscriptionClient) {
      this.subscriptionClient = paramsOrClient;
    } else {
      this.subscriptionClient = new SubscriptionClient(
        paramsOrClient.uri,
        paramsOrClient.hubUri,
        paramsOrClient.httpOptions
      );
    }
  }

  request(operation) {
    return new Observable(observer => {
      const subscription = this.subscriptionClient.subscribe(
        Object.assign(operation, { query: print(operation.query) }),
        data => observer.next({ data })
      );

      return () => this.subscriptionClient.unsubscribe(subscription);
    });
  }
}

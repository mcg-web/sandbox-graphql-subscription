# GraphQL Subscription poc

```bash
docker run  \
    -e CORS_ALLOWED_ORIGINS='http://localhost:8000' \
    -e PUBLISHER_JWT_KEY='!mySuperPublisherSecretKey!' \
    -e SUBSCRIBER_JWT_KEY='!mySuperSubscriberSecretKey!' \
    -e PUBLISH_ALLOWED_ORIGINS='http://localhost:8080' \
    -p 5000:80 \
    dunglas/mercure
```

```graphql
query getRooms {
  rooms {
    id
    name
    messages {
      roomId
      timestamp
      body
    }
  }
}

mutation sendMessageToFoo {
	chat(roomName: "foo", body: "my message") {
    roomId
    timestamp
    body
  }
}
```

## start a subscription

```bash
curl --request POST \
  --url http://localhost:8000/subscription/ \
  --header 'content-type: application/graphql' \
  --data 'subscription {  inbox(roomName: "foo") { roomId, timestamp, body} }'
```


create a cookie with `mercureAuthorization={token}`


```javascript
var url = new URL('http://localhost:5000/hub')
url.searchParams.append('topic', 'http://localhost:8000/subscriptions/b02bfaa2bb46');
var eventSource = new EventSource(url, {withCredentials: true});
eventSource.onmessage = e => console.log(JSON.parse(e.data));
```



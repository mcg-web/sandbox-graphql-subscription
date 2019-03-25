# GraphQL Subscription poc

## Install

```bash
composer i
```

## Run

### Symfony

```bash
bin/console server:run localhost:8000
```

### Mercure

```bash
docker run  \
    -e CORS_ALLOWED_ORIGINS='http://localhost:8000' \
    -e PUBLISHER_JWT_KEY='!mySuperPublisherSecretKey!' \
    -e SUBSCRIBER_JWT_KEY='!mySuperSubscriberSecretKey!' \
    -p 5000:80 \
    dunglas/mercure
```

## GraphQL test query and mutation

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

### using curl

```bash
curl --request POST \
  --url http://localhost:8000/subscription/ \
  --header 'content-type: application/graphql' \
  --data 'subscription {  inbox(roomName: "foo") { roomId, timestamp, body} }'
```

### full example with javascript

```javascript
(async () => {
  // start a subscription
  const rawResponse = await fetch("http://localhost:8000/subscription/", {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({query: 'subscription {  inbox(roomName: "foo") { roomId, timestamp, body} }'})
  });
  const payload = await rawResponse.json();
  console.log(payload);

  if (payload.type === 'start') {
    var url = new URL('http://localhost:5000/hub');
    url.searchParams.append('topic', payload.topic);
    // create the new mercureAuthorization cookie, this can be done by Authorization header 
    // but EventSource does not support header.
    // can't use CORS wildcard with credentials.
    document.cookie = "mercureAuthorization="+payload.token;
    var eventSource = new EventSource(url, {withCredentials: true});
    eventSource.onmessage = e => console.log(JSON.parse(e.data));
  }
})();
```



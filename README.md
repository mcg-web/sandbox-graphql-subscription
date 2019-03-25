# GraphQL Subscription POC

## Start docker

```bash
docker-compose up -d
```

## Install

```bash
docker-compose exec app_demo bash -c "composer i"
docker-compose exec -u www-data app_demo bash -c "php bin/console doctrine:migrations:migrate"
```

## GraphQL test query and mutation

```graphql
query getRooms {
  rooms {
    id
    name
    messages {
      roomId
      createdAt
      body
    }
  }
}

mutation sendMessageToFoo {
	chat(roomName: "foo", body: "my message") {
    roomId
    createdAt
    body
  }
}
```

## Start a subscription

### using curl

```bash
curl --request POST \
  --url http://localhost:8000/subscription/ \
  --header 'content-type: application/graphql' \
  --data 'subscription {  inbox(roomName: "foo") { roomId, createdAt, body} }'
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
    body: JSON.stringify({query: 'subscription {  inbox(roomName: "foo") { roomId, createdAt, body} }'})
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



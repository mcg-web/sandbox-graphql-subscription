import React from "react";
import ReactDOM from "react-dom";
import "./styles/index.css";
import App from "./components/App";
import * as serviceWorker from "./serviceWorker";
import { ApolloProvider } from "react-apollo";
import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { BrowserRouter } from "react-router-dom";
import { SSELink } from "./subscriptionClient";
import { split } from "apollo-link";
import { getMainDefinition } from "apollo-utilities";

const HOSTNAME = window.location.hostname;
const endpoints = {
  symfony: {
    graphql: `http://${HOSTNAME}:8000`,
    subscriptions: `http://${HOSTNAME}:8000/subscriptions`,
  },
  php: {
    graphql: `http://${HOSTNAME}:8000/graphql.php`,
    subscriptions: `http://${HOSTNAME}:8000/graphql.php`,
  }
};
const type = window.location.hash ? window.location.hash.substr(1) : "symfony";

const httpLink = createHttpLink({
  uri: endpoints[type].graphql,
});
const sseLink = new SSELink({
  uri: endpoints[type].subscriptions,
  hubUri: `http://${HOSTNAME}:5000/hub`
});

const link = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  },
  sseLink,
  httpLink
);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
});

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

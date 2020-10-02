import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import React from "react";
import ReactDOM from "react-dom";
import Pages from "./pages";
import injectStyles from "./styles";

const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  // URI of our GraphQL server.
  uri: "http://localhost:4000/",
  // Instance of InMemoryCache to use as the client's cache.
  cache: new InMemoryCache(),
});

injectStyles();
ReactDOM.render(
  // Inject our client into the ApolloProvider.
  <ApolloProvider client={client}>
    <Pages />
  </ApolloProvider>,
  document.getElementById("root")
);

require("dotenv").config();
const { ApolloServer } = require("apollo-server");
const typeDefs = require("./schema");

// Create an instance of ApolloServer and pass it the imported schema.
const server = new ApolloServer({ typeDefs });

// Log the URL.
server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

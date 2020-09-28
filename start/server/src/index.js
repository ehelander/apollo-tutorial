require("dotenv").config();
const { ApolloServer } = require("apollo-server");
const typeDefs = require("./schema");
const { createStore } = require("./utils");
const resolvers = require("./resolvers");
const isEmail = require("isemail");

const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");

const store = createStore();

const server = new ApolloServer({
  /*
    1. Get the `Authorization` header value (if any).
    2. Decode the `Authorization` header value.
    3. If the value is an email address, retrieve the user. Return the `user` in an object.
  */
  context: async ({ req }) => {
    // Perform simple auth check on each request.
    const auth = (req.headers && req.headers.authorization) || "";
    const email = Buffer.from(auth, "base64").toString("ascii");
    if (!isEmail.validate(email)) return { user: null };
    // Find user by email.
    const users = await store.users.findOrCreate({ where: { email } });
    const user = (users && users[0]) || null;
    if (user === null) {
      return { user: null };
    }
    return { user: { ...user.dataValues } };
  },
  typeDefs,
  resolvers,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

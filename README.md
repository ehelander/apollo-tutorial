# Apollo tutorial

This is the fullstack app for the [Apollo tutorial](http://apollographql.com/docs/tutorial/introduction.html). 🚀

## File structure

The app is split out into two folders:

- `start`: Starting point for the tutorial
- `final`: Final version

From within the `start` and `final` directories, there are two folders (one for `server` and one for `client`).

## Installation

To run the app, run these commands in two separate terminal windows from the root:

```bash
cd final/server && npm i && npm start
```

and

```bash
cd final/client && npm i && npm start
```

## Notes

### [0. Introduction](https://www.apollographql.com/docs/tutorial/introduction/)

- Clone example app:

  ```sh
  git clone https://github.com/apollographql/fullstack-tutorial.git
  ```

### [1. Build a schema](https://www.apollographql.com/docs/tutorial/schema/)

- Set up Apollo Server

  ```sh
  cd fullstack-tutorial/start/server
  npm install
  npm audit fix
  ```

- In `src/index.js`:

  ```js
  const { ApolloServer } = require("apollo-server");
  const typeDefs = require("/.schema");

  // Create an instance of ApolloServer and pass it the imported schema.
  const server = new ApolloServer({ typeDefs });
  ```

- In `src/schema.js`:

  ```js
  const { gql } = require("apollo-server");

  // We'll use GraphQL's schema definition language (SDL).
  const typeDefs = gql`
    type Launch {
      id: ID!
      site: String
      mission: Mission
      rocket: Rocket
      isBooked: Boolean!
    }

    type Rocket {
      id: ID!
      name: String
      type: String
    }

    type User {
      id: ID!
      email: String!
      trips: [Launch]!
    }

    type Mission {
      name: String
      missionPatch(size: PatchSize): String
    }

    enum PatchSize {
      SMALL
      LARGE
    }

    type Query {
      launches: [Launch]!
      launch(id: ID!): Launch
      me: User
    }

    type Mutation {
      bookTrips(launchIds: [ID]!): TripUpdateResponse!
      cancelTrip(launchId: ID!): TripUpdateResponse!
      login(email: String): String # login token
    }

    type TripUpdateResponse {
      success: Boolean!
      message: String
      launches: [Launch]
    }
  `;

  module.exports = typeDefs;
  ```

- In `src/index.js`:

  ```js
  require("dotenv").config();
  const { ApolloServer } = require("apollo-server");
  const typeDefs = require("./schema");

  // Create an instance of ApolloServer and pass it the imported schema.
  const server = new ApolloServer({ typeDefs });

  // Log the URL.
  server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
  ```

- Run `npm start`.
- Navigate to the GraphQL Playground at http://localhost:4000/

### [2. Connect to data sources](https://www.apollographql.com/docs/tutorial/data-source/)

- `src/datasources/launch.js`:

  ```js
  const { RESTDataSource } = require("apollo-datasource-rest");

  // RESTDataSource extends DataSource.
  // RESTDataSource automatically caches responses from REST resources (partial query caching).
  class LaunchAPI extends RESTDataSource {
    constructor() {
      super();
      this.baseURL = "https://api.spacexdata.com/v2/";
    }

    async getAllLaunches() {
      // RESTDataSource provides helper methods for GET, POST, etc.
      // `this.get("launches");` -> GET https://api.spacexdata.com/v2/launches.
      const response = await this.get("launches");
      return Array.isArray(response)
        ? response.map((launch) => this.launchReducer(launch))
        : [];
    }

    async getLaunchById({ launchId }) {
      const response = await this.get("launches", { flight_number: launchId });
      return this.launchReducer(response[0]);
    }

    getLaunchesByIds({ launchIds }) {
      return Promise.all(
        launchIds.map((launchId) => this.getLaunchById({ launchId }))
      );
    }

    launchReducer(launch) {
      return {
        id: launch.flight_number || 0,
        cursor: `${launch.launch_date_unix}`,
        site: launch.launch_site && launch.launch_site.site_name,
        mission: {
          name: launch.mission_name,
          missionPatchSmall: launch.links.mission_patch_small,
          missionPatchLarge: launch.links.mission_patch,
        },
        rocket: {
          id: launch.rocket.rocket_id,
          name: launch.rocket.rocket_name,
          type: launch.rocket.rocket_type,
        },
      };
    }
  }

  module.exports = LaunchAPI;
  ```

- `src/index.js`:
  - Note that, if a data source uses `this.context`, it's important to create a new instance in the `dataSources` function.
    - Otherwise, `initialize()` could get called, thereby replacing `this.context` with a different context.

```js
require("dotenv").config();
const { ApolloServer } = require("apollo-server");
const typeDefs = require("./schema");
const { createStore } = require("./utils");

const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");

const store = createStore();

const server = new ApolloServer({
  typeDefs,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
```

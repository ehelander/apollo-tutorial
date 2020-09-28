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

### [3. Write query resolvers](https://www.apollographql.com/docs/tutorial/resolvers/)

- "A resolver is a function that's responsible for populating the data for a single field in your schema."
- A resolver returns either:
  - Data of the required type.
  - A promise that fulfills with data of the required type.
- Resolver function signature:

  ```js
  fieldName: (parent, args, context, info) => data;
  ```

  - `parent`
    - Return value of the resolver for this field's parent.
      - Resolvers for parents execute before resolvers for children.
  - `args`
    - GraphQL arguments provided for the field (e.g., https://graphql.org/graphql-js/passing-arguments/).
  - `context`
    - Shared across all resolvers executing for a particular operation.
      - Use to share per-operation state (e.g., authentication information for accessing data sources).
  - `info`
    - Info about the operation's execution state.
      - Only for advanced usage.

- `src/resolvers.js`:

  - Best practice: Keep resolvers short.
    - Encapsulate logic in the data sources.

  ```js
  module.exports = {
    // Define the queries in a map, where the keys correspond to schema types...
    Query: {
      // ...and fields.
      launches: (_, __, { dataSources }) =>
        dataSources.launchAPI.getAllLaunches(),
      launch: (_, { id }, { dataSources }) =>
        dataSources.launchAPI.getLaunchById({ launchId: id }),
      me: (_, __, { dataSources }) => dataSources.userAPI.findOrCreateUser(),
    },
  };
  ```

- Add resolvers to `src/index.js`:

  ```js
  const { ApolloServer } = require("apollo-server");
  const typeDefs = require("./schema");
  const { createStore } = require("./utils");
  const resolvers = require("./resolvers");

  const LaunchAPI = require("./datasources/launch");
  const UserAPI = require("./datasources/user");

  const store = createStore();

  const server = new ApolloServer({
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
  ```

- Submit the following queries in the GraphQL Playground:

  ```graphql
  query GetLaunches {
    launches {
      id
      mission {
        name
        missionPatch
      }
    }
  }

  # Variables:
  # {
  #   "id": 60
  # }
  query GetLaunchById($id: ID!) {
    # launch(id: 60) {
    launch(id: $id) {
      id
      rocket {
        id
        type
      }
    }
  }
  ```

  - Note that `null` is returned for `missionPatch`. We need a custom resolver.
  - Apollo Server defines a default resolver for any field that doesn't have a custom resolver.
    - ![](2020-09-25-15-10-40.png)

- Add resolvers for `Mission`, Launch, and User to `src/resolvers.js`:

  ```js
  module.exports = {
    // Define the queries in a map, where the keys correspond to schema types...
    Query: {
      // ...and fields.
      launches: (_, __, { dataSources }) =>
        dataSources.launchAPI.getAllLaunches(),
      launch: (_, { id }, { dataSources }) =>
        dataSources.launchAPI.getLaunchById({ launchId: id }),
      me: (_, __, { dataSources }) => dataSources.userAPI.findOrCreateUser(),
    },
    Mission: {
      // Default size: 'LARGE'.
      missionPatch: (mission, { size } = { size: "LARGE" }) => {
        return size === "SMALL"
          ? mission.missionPatchSmall
          : mission.missionPatchLarge;
      },
    },
    Launch: {
      isBooked: async (launch, _, { dataSources }) => {
        dataSources.userAPI.isBookedOnLaunch({ launchId: launch.id });
      },
    },
    User: {
      trips: async (_, __, { dataSources }) => {
        // Get IDs of launches by user.
        const launchIds = await dataSources.userAPI.getLaunchIdsByUser();
        if (!launchIds.length) return [];
        // Look up those launches by their IDs.
        return (
          dataSources.launchAPI.getLaunchesByIds({
            launchIds,
          }) || []
        );
      },
    },
  };
  ```

- Recommendation for numbered pages: Cursor-based pagination.
  - Prevents skipping an item or displaying the same item multiple times.
  - A constant pointer (or cursor) keeps track of where to start the next set of results.
- Update `src/schema.js` to use cursor-based pagination:

```js
// ...
const typeDefs = gql`
  # ...

  """
  Simple wrapper around our list of launches that contains a cursor to the
  last item in the list. Pass this cursor to the launches query to fetch
  results after these.
  """
  type LaunchConnection {
    cursor: String!
    hasMore: Boolean!
    launches: [Launch]!
  }

  # ...

  type Query {
    launches(
      """
      The number of results to show. Must be >= 1. Default = 20.
      """
      pageSize: Int
      """
      If you add a cursor here, it will only return results _after_ this cursor.
      """
      after: String
    ): LaunchConnection!
    launch(id: ID!): Launch
    me: User
  }
  # ...
`;
```

- Update `src/resolvers.js` to use pagination:

```js
const { paginateResults } = require("./utils");

module.exports = {
  // Define the queries in a map, where the keys correspond to schema types...
  Query: {
    // ...and fields.
    launches: async (_, { pageSize = 20, after }, { dataSources }) => {
      const allLaunches = await dataSources.launchAPI.getAllLaunches();
      // Get reverse chronological order.
      allLaunches.reverse();
      const launches = paginateResults({
        after,
        pageSize,
        results: allLaunches,
      });
      return {
        launches,
        cursor: launches.length ? launches[launches.length - 1].cursor : null,
        // If the cursor at the end of the paginated results is the final item in _all_ results,
        // there are no more results.
        hasMore: launches.length
          ? launches[launches.length - 1].cursor !==
            allLaunches[allLaunches.length - 1].cursor
          : false,
      };
    },
    // ...
  },
  // ...
};
// ...
```

- Try out a query using pagination. Only 3 launches should be returned.

  ```graphql
  query GetLaunches {
    launches(pageSize: 3) {
      launches {
        id
        mission {
          name
          missionPatch
        }
      }
    }
  }
  ```

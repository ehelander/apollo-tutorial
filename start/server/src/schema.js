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

  type Mission {
    name: String
    missionPatch(size: PatchSize): String
  }

  type Mutation {
    bookTrips(launchIds: [ID]!): TripUpdateResponse!
    cancelTrip(launchId: ID!): TripUpdateResponse!
    login(email: String): String # login token
  }

  enum PatchSize {
    SMALL
    LARGE
  }

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

  type Rocket {
    id: ID!
    name: String
    type: String
  }

  type TripUpdateResponse {
    success: Boolean!
    message: String
    launches: [Launch]
  }

  type User {
    id: ID!
    email: String!
    trips: [Launch]!
  }
`;

module.exports = typeDefs;

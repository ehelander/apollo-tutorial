/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: TestQuery
// ====================================================

export interface TestQuery_launch_mission {
  __typename: "Mission";
  name: string | null;
}

export interface TestQuery_launch {
  __typename: "Launch";
  id: string;
  mission: TestQuery_launch_mission | null;
}

export interface TestQuery {
  launch: TestQuery_launch | null;
}

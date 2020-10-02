import React, { Fragment } from "react";
import { gql, useQuery } from "@apollo/client";

import { LaunchTile, Header, Button, Loading } from "../components";
import { RouteComponentProps } from "@reach/router";
import * as GetLaunchListTypes from "./__generated__/GetLaunchList";

export const LAUNCH_TILE_DATA = gql`
  fragment LaunchTile on Launch {
    id
    # isBooked
    rocket {
      id
      name
    }
    mission {
      name
      missionPatch
    }
  }
`;

// Define a query.
const GET_LAUNCHES = gql`
  query launchList($after: String) {
    launches(after: $after) {
      cursor
      hasMore
      launches {
        ...LaunchTile
      }
    }
  }
  ${LAUNCH_TILE_DATA}
`;

interface LaunchesProps extends RouteComponentProps {}

// Pass the query to Apollo's useQuery hook and render the list.
const Launches: React.FC<LaunchesProps> = () => {
  const { data, loading, error, fetchMore } = useQuery<
    GetLaunchListTypes.GetLaunchList,
    GetLaunchListTypes.GetLaunchListVariables
  >(GET_LAUNCHES);

  if (loading) return <Loading />;
  if (error) return <p>ERROR: {error?.message}</p>;
  if (!data) return <p>Not Found</p>;
  return (
    <Fragment>
      <Header />
      {data?.launches?.launches?.map((launch: any) => (
        <LaunchTile key={launch.id} launch={launch} />
      ))}
      {data?.launches?.hasMore && (
        <Button
          onClick={() =>
            fetchMore({
              variables: { after: data.launches?.cursor },
              // Tell Apollo how to update the list of launches in the cache:
              // Merge the previous result and the new query result.
              updateQuery: (prev, { fetchMoreResult, ...rest }) => {
                if (!fetchMoreResult) return prev;
                return {
                  ...fetchMoreResult,
                  launches: {
                    ...fetchMoreResult?.launches,
                    launches: [
                      ...prev?.launches?.launches,
                      ...fetchMoreResult?.launches?.launches,
                    ],
                  },
                };
              },
            })
          }
        >
          Load More
        </Button>
      )}
    </Fragment>
  );
};

export default Launches;

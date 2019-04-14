import React, { Component } from "react";
import { Room } from "./Room";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { CreateMessage } from "./CreateMessage";
import { CreateRoom } from "./CreateRoom";

export const ROOMS_QUERY = gql`
  {
    rooms {
      id
      name
      countMessages
      createdAt
    }
  }
`;

export class RoomList extends Component {
  render() {
    return (
      <Query query={ROOMS_QUERY}>
        {({ loading, error, data }) => {
          if (loading) return <div>Fetching</div>;
          if (error) return <div>Error</div>;

          const roomsToRender = data.rooms;

          return (
            <ul className="list pl0 mt0 measure left">
              {roomsToRender.map(room => (
                <Room key={room.id} room={room} />
              ))}
            </ul>
          );
        }}
      </Query>
    );
  }
}

import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { ROOMS_QUERY } from "./RoomList";

const ROOM_MUTATION = gql`
  mutation createRoom($name: String!) {
    createRoom(name: $name) {
      id
      name
      createdAt
      countMessages
    }
  }
`;

export class CreateRoom extends Component {
  state = {
    name: ""
  };

  render() {
    const { name } = this.state;
    return (
      <div>
        <form className="bg-light-red mw7 center pa4 br2-ns ba b--black-10">
          <fieldset className="cf bn ma0 pa0">
            <legend className="pa0 f5 f4-ns mb3 black-80">Create a new room</legend>
            <div className="cf">
              <input
                className="f6 f5-l input-reset bn fl black-80 bg-white pa3 lh-solid w-100 w-75-m w-80-l br2-ns br--left-ns"
                value={name}
                onChange={e => this.setState({ name: e.target.value })}
                type="text"
                placeholder="The name of the room"
              />
              <Mutation
                mutation={ROOM_MUTATION}
                variables={{ name }}
                onCompleted={() => this.props.history.push("/")}
                update={(store, { data: { createRoom } }) => {
                  const data = store.readQuery({ query: ROOMS_QUERY });
                  data.rooms.unshift(createRoom);
                  store.writeQuery({
                    query: ROOMS_QUERY,
                    data
                  });
                }}
              >
                {postMutation => (
                  <button
                    onClick={postMutation}
                    className="f6 f5-l button-reset fl pv3 tc bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--right-ns"
                  >
                    Add
                  </button>
                )}
              </Mutation>
            </div>
          </fieldset>
        </form>
      </div>
    );
  }
}

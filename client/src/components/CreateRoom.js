import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'
import {ROOMS_QUERY} from "./RoomList";

const ROOM_MUTATION = gql`
  mutation createRoom($name: String!) {
    createRoom(name: $name) {
      id
      name
      createdAt
      countMessages
    }
  }

`

export class CreateRoom extends Component {
  state = {
    name: '',
  }

  render() {
    const { name } = this.state
    return (
      <div>
        <div className="flex flex-column mt3">
          <input
            className="mb2"
            value={name}
            onChange={e => this.setState({ name: e.target.value })}
            type="text"
            placeholder="The name of the room"
          />
        </div>
        <Mutation
          mutation={ROOM_MUTATION}
          variables={{ name }}
          onCompleted={() => this.props.history.push('/')}
          update={(store, { data: {createRoom}}) => {
            const data = store.readQuery({ query: ROOMS_QUERY })
            data.rooms.unshift(createRoom)
            store.writeQuery({
              query: ROOMS_QUERY,
              data
            })
          }}
        >
          {postMutation => <button onClick={postMutation}>Submit</button>}
        </Mutation>
      </div>
    )
  }
}

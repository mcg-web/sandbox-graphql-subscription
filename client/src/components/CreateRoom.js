import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'

const ROOM_MUTATION = gql`
  mutation createRoom($name: String!) {
    createRoom(name: $name) {
      id
      name
    }
  }

`

class CreateRoom extends Component {
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
        >
          {postMutation => <button onClick={postMutation}>Submit</button>}
        </Mutation>
      </div>
    )
  }
}

export default CreateRoom

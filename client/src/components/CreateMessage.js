import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'

const MESSAGE_MUTATION = gql`
  mutation createFooMessage($roomId: Int!, $nickname: String!, $body: String!) {
    chat(roomId: $roomId, nickname: $nickname, body: $body) {
      id
      roomId
      nickname
      body
    }
  }

`

export class CreateMessage extends Component {
  state = {
    roomId: this.props.roomId,
    nickname: '',
    body: '',
  }

  render() {
    const { roomId, body, nickname } = this.state
    return (
      <div>
        <div className="flex flex-column mt3">
          <input
            className="mb2"
            value={nickname}
            onChange={e => this.setState({ nickname: e.target.value })}
            type="text"
            placeholder="your nickname"
          />
          <textarea
            className="mb2s"
            value={body}
            onChange={e => this.setState({ body: e.target.value })}
          />
        </div>
        <Mutation
          mutation={MESSAGE_MUTATION}
          variables={{ body, nickname, roomId }}
          onCompleted={() => this.props.history.push('/')}
        >
          {postMutation => <button onClick={postMutation}>Submit</button>}
        </Mutation>
      </div>
    )
  }
}

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
      <div className="bg-light-red mw7 center pa4 br2-ns ba b--black-10">
        <fieldset className="cf bn ma0 pa0">
          <legend className="pa0 f5 f4-ns mb3 black-80">Message</legend>
          <div className="cf">
            <textarea
              className="f6 f5-l input-reset bn fl black-80 bg-white pa3 lh-solid w-100 w-75-m w-80-l br2-ns br--left-ns"
              value={body}
              onChange={e => this.setState({ body: e.target.value })}
            />
          </div>
          <div className="cf">
            <input
              className="f6 f5-l input-reset bn fl black-80 bg-white pa3 lh-solid w-100 w-75-m w-80-l br2-ns br--left-ns"
              value={nickname}
              onChange={e => this.setState({ nickname: e.target.value })}
              type="text"
              placeholder="your nickname"
            />
            <Mutation
              mutation={MESSAGE_MUTATION}
              variables={{ body, nickname, roomId }}
              onCompleted={() => this.setState({ body: "" })}
            >
              {postMutation => (
                <button
                  className="f6 f5-l button-reset fl pv3 tc bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--right-ns"
                  onClick={postMutation}
                >
                  Submit
                </button>
              )}
            </Mutation>
          </div>
        </fieldset>
      </div>
    );
  }
}

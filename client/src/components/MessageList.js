import React, { Component } from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import {CreateMessage} from "./CreateMessage";
import {Message} from "./Message";

const MESSAGES_QUERY = gql`
  query getMessages($roomId: Int!){
    messages(roomId: $roomId) {
      id
      roomId
      createdAt
      nickname
      body
    }
  }
`

export class MessageList extends Component {
  render() {
    const { roomId } = this.props.match.params
    return (
      <Query query={MESSAGES_QUERY} variables={{roomId}}>
        {({ loading, error, data }) => {
          if (loading) return <div>Fetching</div>
          if (error) return <div>Error</div>

          const messagesToRender = data.messages

          return (
            <div>
              {messagesToRender.map(message => <Message key={message.id} message={message} />)}
              <CreateMessage roomId={roomId}/>
            </div>
          )
        }}
      </Query>
    )
  }
}

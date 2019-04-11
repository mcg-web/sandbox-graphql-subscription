import React, { Component } from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { CreateMessage } from "./CreateMessage";
import { Message } from "./Message";

const MESSAGES_QUERY = gql`
  query getMessages($roomId: Int!) {
    messages(roomId: $roomId) {
      id
      roomId
      createdAt
      nickname
      body
    }
  }
`;

const NEW_MESSAGES_SUBSCRIPTION = gql`
  subscription getNewMessage($roomId: Int!) {
    inbox(roomId: $roomId) {
      id
      roomId
      nickname
      createdAt
      body
    }
  }
`;

class MessageInner extends Component {
  constructor(props, context) {
    super(props, context);
    this._subscribeToNewMessages(props.subscribeToMore);
  }

  _subscribeToNewMessages = subscribeToMore => {
    const { roomId } = this.props;
    subscribeToMore({
      document: NEW_MESSAGES_SUBSCRIPTION,
      variables: { roomId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newMessage = subscriptionData.data.inbox;
        const exists = prev.messages.find(({ id }) => id === newMessage.id);
        if (exists) return prev;

        return Object.assign({}, prev, {
          messages: [newMessage, ...prev.messages]
        });
      }
    });
  };

  render() {
    const { messagesToRender, roomId } = this.props;
    return (
      <div>
        {messagesToRender.map(message => (
          <Message key={message.id} message={message} />
        ))}
        <CreateMessage roomId={roomId} />
      </div>
    );
  }
}

export class MessageList extends Component {
  render() {
    const { roomId } = this.props.match.params;
    return (
      <Query query={MESSAGES_QUERY} variables={{ roomId }}>
        {({ loading, error, data, subscribeToMore }) => {
          if (loading) return <div>Fetching</div>;
          if (error) return <div>Error</div>;

          const messagesToRender = data.messages;

          return (
            <MessageInner
              subscribeToMore={subscribeToMore}
              messagesToRender={messagesToRender}
              roomId={roomId}
            />
          );
        }}
      </Query>
    );
  }
}

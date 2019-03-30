import React, { Component } from 'react'
import Room from './Room'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'

export const ROOMS_QUERY = gql`
  {
    rooms {
      id
      name
      createdAt
    }
  }
`

class RoomList extends Component {
  render() {
    return (
      <Query query={ROOMS_QUERY}>
        {({ loading, error, data }) => {
          if (loading) return <div>Fetching</div>
          if (error) return <div>Error</div>

          const roomsToRender = data.rooms

          return (
            <div>
              {roomsToRender.map(room => <Room key={room.id} room={room} />)}
            </div>
          )
        }}
      </Query>
    )
  }
}

export default RoomList

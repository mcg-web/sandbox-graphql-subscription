import React, { Component } from 'react'
import CreateRoom from './CreateRoom'
import RoomList from './RoomList'
import Header from './Header'
import { Switch, Route } from 'react-router-dom'
import MessageList from "./MessageList";

class App extends Component {
  render() {
    return (
      <div className="center w85">
        <Header />
        <div className="ph3 pv1 background-gray">
          <Switch>
            <Route exact path="/" component={RoomList} />
            <Route exact path="/create" component={CreateRoom} />
            <Route path="/:roomId/messages" component={MessageList} />
          </Switch>
        </div>
      </div>
    )
  }
}

export default App

import React, {Component} from 'react'
import { Link } from 'react-router-dom'
import {timeDifferenceForDate} from "../utils";

class Room extends Component {
  render() {
    return (
      <div className="flex mt2 items-start">
        <div className="ml1">
          <Link to={`/${this.props.room.id}/messages`}>{this.props.room.name} (#{this.props.room.id})</Link>
          <div className="f6 lh-copy gray">
            {this.props.room.countMessages} Message(s) — {timeDifferenceForDate(this.props.room.createdAt)}
          </div>
        </div>
      </div>
    )
  }
}

export default Room

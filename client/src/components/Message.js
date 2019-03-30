import React, {Component} from 'react'
import { timeDifferenceForDate } from '../utils'

class Room extends Component {
  render() {
    return (
      <div className="flex mt2 items-start">
        <div className="ml1">
          {this.props.message.body}
          <div className="f6 lh-copy gray">
            {this.props.message.nickname}{' '}
            {timeDifferenceForDate(this.props.message.createdAt)}
          </div>
        </div>
      </div>
    )
  }
}

export default Room

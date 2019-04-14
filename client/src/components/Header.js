import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'

class Header extends Component {
  render() {
    return (
      <div className="flex pa1 justify-between nowrap orange">
        <div className="flex flex-fixed black">
          <Link to="/" className="fw7 mr1 ml1 no-underline white">
            Live chat
          </Link>
        </div>
      </div>
    )
  }
}

export default withRouter(Header)

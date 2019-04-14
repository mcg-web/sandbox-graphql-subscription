import React, { Component } from "react";
import { Link } from "react-router-dom";
import { timeDifferenceForDate } from "../utils";

export class Room extends Component {
  render() {
    return (
      <li className="flex items-center lh-copy pa3 ph0-l bb b--black-10">
        <img
          className="w2 h2 w3-ns h3-ns br-100"
          alt="${this.props.message.nickname}"
          src={`https://ui-avatars.com/api/?length=3&background=ff6600&color=fff&name=${
            this.props.room.name
          }`}
        />
        <div className="pl3 flex-auto">
          <span className="f6 db black-70">
            <Link to={`/${this.props.room.id}/messages`} className="f6 link blue hover-dark-gray">
              {this.props.room.name} (#{this.props.room.id})
            </Link>
          </span>
          <span className="f6 db black-70">
            {this.props.room.countMessages} Message(s) —{" "}
            {timeDifferenceForDate(this.props.room.createdAt)}
          </span>
        </div>
      </li>
    );
  }
}

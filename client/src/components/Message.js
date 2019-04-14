import React, { Component } from "react";
import { timeDifferenceForDate } from "../utils";

export class Message extends Component {
  render() {
    return (
      <li className="flex items-center lh-copy pa3 ph0-l bb b--black-10">
        <img
          className="w2 h2 w3-ns h3-ns br-100"
          alt="${this.props.message.nickname}"
          src={`https://ui-avatars.com/api/?name=${
            this.props.message.nickname
          }&background=ff6600&color=fff`}
        />
        <div className="pl3 flex-auto">
          <span className="f6 db black-70">{this.props.message.body}</span>
          <span className="f6 db black-70">
            {this.props.message.nickname}{" "}
            {timeDifferenceForDate(this.props.message.createdAt)}
          </span>
        </div>
      </li>
    );
  }
}

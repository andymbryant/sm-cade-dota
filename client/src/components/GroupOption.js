import React, { Component } from 'react';

class GroupOption extends Component {
    render() {

        const { group } = this.props;

        return (
            <div className="unit-option" key={group}>{group}</div>
        );
    }
}

export default GroupOption;
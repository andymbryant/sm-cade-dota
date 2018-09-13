import React, { Component } from 'react';
import _ from 'lodash'

import { Context } from '../../../../Provider.js';
import UnitOption from './UnitOption/UnitOption.js';

class GroupOption extends Component {

    state = {
        active: false,
        hover: false
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (_.includes(nextProps.state.selectedUnits, ...nextProps.groupUnits)) {
            return {
                active: true
            };
        }
        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.hover !== nextState.hover) {
            return true;
        } else if (nextState.active !== this.state.active) {
            return true;
        } else {
            return false;
        }
    }

    toggleHover = () => {
        this.setState({
            hover: !this.state.hover
        })
    }

    toggleActive = () => {
        this.setState({
            active: !this.state.active
        })
    }

    render() {
        const { groupUnits, group, toggleGroup } = this.props;

        let buttonStyle;

        if (this.state.hover || this.state.active) {
            buttonStyle = { backgroundColor: group }
        }

        return (
            <div className="group-option-container">
                <div className='group-option' style={buttonStyle} key={group} onMouseOver={() => this.toggleHover()} onMouseLeave={() => this.toggleHover()} onClick={() => { this.toggleActive(); toggleGroup(groupUnits) }} >{group}</div>
                <div className="unit-selection">
                    {groupUnits.map(function (unit) {
                        return <UnitOption unit={unit} key={unit} />
                    })}
                </div>
            </div>
        );
    }
}

export default (props) => (
    <Context.Consumer>
        {(context) => <GroupOption {...context} {...props} />}
    </Context.Consumer>
);
import React, { Component } from 'react';

import { Context } from '../../../Provider.js';
import UnitOption from './UnitOption/UnitOption.js';

class GroupOption extends Component {

    state = {
        active: true,
        hover: false
    }

    // If all units are active, group is active and vice versa
    static getDerivedStateFromProps(nextProps) {
        const isSuperset = nextProps.groupUnits.every(function (val) { return nextProps.selectedUnits.indexOf(val) >= 0; });
        if (isSuperset) {
            return {
                active: true
            }
        } else {
            return {
                active: false
            }
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
        const { toggleGroup, formatFirstString } = this.context;
        const { groupUnits, group } = this.props;

        let buttonStyle;

        // Conditional styling, based on hover and active states
        if (this.state.hover) {
            buttonStyle = {
                boxShadow: "0px 0px 1px black",
                backgroundColor: group.color,
                fontWeight: 700
            }
        } else if (this.state.active) {
            buttonStyle = {
                backgroundColor: group.color,
                fontWeight: 700
            }
        }
        else {
            buttonStyle = {
                backgroundColor: "grey"
            }
        }

        // Renders UnitOptions for each groupUnit in GroupUnits data
        return (
            <div className="unit-selection">
                <div className='group-option' style={buttonStyle} key={group.name} onMouseOver={() => this.toggleHover()} onMouseLeave={() => this.toggleHover()} onClick={() => { this.toggleActive(); toggleGroup(groupUnits) }} >{formatFirstString(group.name)}</div>
                {groupUnits.map(function (unit) {
                    return <UnitOption unit={unit} key={unit} />
                })}
            </div>
        );
    }
}

// Enables access to context in component
GroupOption.contextType = Context;

export default GroupOption;
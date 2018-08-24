import React, { Component } from 'react';

import { Context } from './Provider.js';

class UnitOption extends Component {

    state = {
        active: false
    }

    toggleClass = () => {
        this.setState({
            active: !this.state.active
        })
    }

    render() {
        let { unit } = this.props;

        return (
            <Context.Consumer>
                {(context) => {
                    // unit = context.formatHeroString(unit);
                    return <div className={this.state.active ? 'unit-option unit-option-active' : 'unit-option'} key={unit} onClick={() => { this.toggleClass(); context.toggleSelectedUnit(unit); }} >{unit}</div>
                }
                }
            </Context.Consumer>
        );
    }
}

export default UnitOption;
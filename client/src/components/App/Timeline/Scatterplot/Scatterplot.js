import React, { Component } from 'react';

import * as d3 from 'd3';

import { Context } from '../../../Provider.js'

class Scatterplot extends Component {
    constructor(props) {
        super(props);

        this.renderScatterplot();
    }

    componentDidUpdate(nextProps) {
        this.renderScatterplot(nextProps);
    }

    renderScatterplot() {
        const { width, zoomTransform, timestampRange } = this.props;

        this.xScaleTime = d3.scaleLinear()
            .domain([timestampRange.start, timestampRange.end])
            .range([0, width])

        if (zoomTransform) {
            this.xScaleTime.domain(zoomTransform.rescaleX(this.xScaleTime).domain());
        }
    }

    render() {
        const { data, events, yScaleTime, toggleActiveNode } = this.props;
        const { units, selectedUnits, selectedEvents } = this.props.state;

        return (
            <g ref="scatterplot">
                {data.map((event) => {
                    return <circle
                        cx={this.xScaleTime(event.timestamp)}
                        cy={yScaleTime(events.indexOf(event.event_type))}
                        r={4}
                        fill={(selectedUnits.includes(event.unit) && (selectedEvents.includes(event.event_type))) ? units[event.unit].color : 'grey'}
                        stroke="black"
                        strokeWidth={1}
                        key={event.node_id}
                        onMouseOver={() => toggleActiveNode(event.node_id)}
                        onMouseOut={() => toggleActiveNode(null)}
                    />
                })
                }
            </g>
        )
    }
}

export default (props) => (
    <Context.Consumer>
        {(context) => <Scatterplot {...context} {...props} />}
    </Context.Consumer>
);
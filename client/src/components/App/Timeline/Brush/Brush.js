import React, { Component } from 'react';

import { Context } from '../../Provider.js';
import * as d3 from 'd3';

class Brush extends Component {
    constructor(props) {
        super(props)
        this.brush = d3.brushX()
            .on('brush', this.brushed)
    }

    componentDidMount() {
        this.renderBrush();
    }

    componentWillUpdate(nextProps) {
        this.updateBrush();
    }

    renderBrush = () => {
        d3.select(this.refs.brush)
            .call(this.brush)
            .call(this.brush.move, [0, 200])
    }

    updateBrush = () => {
        const brush = d3.brushX()
            .on('brush', this.brushed)

        d3.select(this.refs.brush)
            .call(brush)
    }

    brushed = () => {
        let s = [100, 200];
        const xScaleTime = d3.scaleLinear()
            .domain([this.props.timestampRange.start, this.props.timestampRange.end])
            .range([0, this.props.width])

        if (d3.event.selection) {
            s = d3.event.selection
        }

        if (this.props.zoomTransform) {
            const newXScale = this.props.zoomTransform.rescaleX(xScaleTime)
            this.props.updateBrushRange([newXScale.invert(s[0]), newXScale.invert(s[1])])
        } else {
            this.props.updateBrushRange([xScaleTime.invert(s[0]), xScaleTime.invert(s[1])])

        }

    }

    render() {
        return (
            <g ref="brush">
            </g>
        )
    }
}

export default (props) => (
    <Context.Consumer>
        {(context) => <Brush {...context} {...props} />}
    </Context.Consumer>
);
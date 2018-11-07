import React, { PureComponent } from 'react';
import { zoom, select, event } from 'd3';

import { Context } from '../../Provider.js'

import Scatterplot from './../Scatterplot/Scatterplot.js';
import XAxis from './../XAxis/XAxis.js';
import AxisLines from './../AxisLines/AxisLines.js';
import Brush from './../Brush/Brush.js';
import GlobalTimeline from './GlobalTimeline/GlobalTimeline.js';

class TimelineChart extends PureComponent {
    constructor(props) {
        super(props);
        this.chart = React.createRef()
        this.zoom = this.getZoom()
        this.state = {
            clicked: false,
            mousePos: 0,
            height: null,
            width: null,
            offsetX: 0,
            zoomTransform: null,
        }
    }

    componentDidMount() {
        this.setState({
            height: 250,
            width: this.chart.current.offsetWidth
        })
        select(this.refs.svg)
            .call(this.zoom)
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     if (this.chart.current.offsetWidth !== this.state.width) {
    //         return true;
    //     }
    //     if (nextState.zoomTransform !== this.state.zoomTransform) {
    //         return true;
    //     }
    //     if (nextProps.state.brushActive !== this.props.state.brushActive) {
    //         return true;
    //     }
    //     return false;
    // }

    componentDidUpdate() {
        select(this.refs.svg)
            .call(this.zoom)
        if (this.chart.current.offsetWidth !== this.state.width) {
            this.setState({
                width: this.chart.current.offsetWidth
            })
        }

    }

    getZoom = () => {
        // const { timestampRange } = this.props.state;

        return zoom()
            .scaleExtent([.9, 15])
            // .translateExtent([[0, timestampRange.start], [this.chart.current.offsetWidth, timestampRange.end]])
            .on("zoom", this.zoomed.bind(this))
    }

    toggleClick = () => {
        this.setState({
            clicked: !this.state.clicked
        })
    }

    drag = (e) => {
        this.setState({
            offsetX: e.clientX
        })
    }

    zoomed() {
        this.setState({
            zoomTransform: event.transform
        });
    }

    render() {
        const { events, timestampRange, timelineSettings, brushActive, unitEventsTimeline } = this.props.state;
        const { yScaleTime, toggleBrushActive } = this.props;

        const heightStyle = {
            height: timelineSettings.height
        }

        if (!this.state.width) {
            return <div className="timeline-chart" ref={this.chart}></div>
        }

        return (
            <div className="timeline-chart" ref={this.chart} style={heightStyle} onKeyDown={(e) => toggleBrushActive(e)} onKeyUp={(e) => toggleBrushActive(e)} tabIndex="0">

                <XAxis
                    width={this.state.width}
                    zoomTransform={this.state.zoomTransform}
                    timestampRange={timestampRange}
                />
                <GlobalTimeline
                    chartWidth={this.state.width}
                    zoomTransform={this.state.zoomTransform}
                />
                <svg width="100%" height="100%" ref="svg" className="timeline-svg-scatter">

                    <AxisLines
                        events={events.timeline}
                        yScaleTime={yScaleTime}
                        width={this.state.width}
                    />
                    {brushActive ?
                        <Brush
                            chartWidth={this.state.width}
                            timestampRange={timestampRange}
                            zoomTransform={this.state.zoomTransform}
                        /> : <g>Empty</g>
                    }
                    <Scatterplot
                        data={unitEventsTimeline}
                        width={this.state.width}
                        zoomTransform={this.state.zoomTransform}
                        timestampRange={timestampRange}
                        events={events.timeline}
                        yScaleTime={yScaleTime}
                    />
                </svg>
            </div>
        );
    }
}

export default () => (
    <Context.Consumer>
        {(context) => <TimelineChart {...context} />}
    </Context.Consumer>
);

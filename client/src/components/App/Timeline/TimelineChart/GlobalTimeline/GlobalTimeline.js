import React, { PureComponent } from 'react';

import { Context } from '../../../Provider.js'
import TimelineLabel from './TimelineLabel/TimelineLabel.js';
import ContextMenu from './ContextMenu/ContextMenu.js';

class GlobalTimeline extends PureComponent {
    // User constructor to create a ref for sizing purposes
    constructor() {
        super()
        this.globalTimeline = React.createRef()
        this.state = {
            contextMenuActive: false
        }
    }

    componentDidMount() {
        this.context.getLoadLabels()
    }

    // Context menu activates on hover, showing pertinent information
    activateContextMenu = (e) => {
        this.setState({
            contextMenuActive: true,
            contextPosX: e.target.getAttribute('x'),
            description: e.target.getAttribute('description'),
            id: e.target.getAttribute('id'),
            author: e.target.getAttribute('author'),
            title: e.target.getAttribute('title')
        })
    }

    disableContextMenu = () => {
        this.setState({
            contextMenuActive: false
        })
    }

    render() {
        const { chartWidth, zoomTransform } = this.props;
        const { shuffleLabels } = this.context;
        const { labels, activeLabel } = this.context.state;

        const globalTimelineStyle = {
            width: chartWidth
        }

        return (
            <div
                style={globalTimelineStyle}
                className="global-timeline-container"
                ref={(gt) => { this.globalTimeline = gt; }}
                onKeyDown={(e) => shuffleLabels(e)}
                onMouseOver={() => this.globalTimeline.focus()}
                tabIndex="0"
            >
                {/* Conditional render of contextmenu based on active state */}
                {this.state.contextMenuActive ? <ContextMenu
                    title={this.state.title}
                    active={this.state.contextMenuActive}
                    posX={`${this.state.contextPosX}px`}
                    description={this.state.description}
                    author={this.state.author}
                    id={this.state.id}
                    disableContextMenu={this.disableContextMenu}
                /> : null}
                <svg width="100%" height="100%" pointerEvents="none">
                    {/* Render timeline labels based on label data */}
                    {labels ? labels.map((label) => {
                        return (
                            <TimelineLabel
                                activeLabel={activeLabel}
                                label={label}
                                zoomTransform={zoomTransform}
                                chartWidth={chartWidth}
                                activateContextMenu={this.activateContextMenu}
                                disableContextMenu={this.disableContextMenu}
                                key={label.description}
                            />
                        )
                    }) : null}
                </svg>
                <div className="context-disable" onMouseEnter={() => this.disableContextMenu()}></div>
            </div >
        );
    }
}

// Enables access to context in component
GlobalTimeline.contextType = Context;

export default GlobalTimeline;

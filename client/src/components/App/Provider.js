import React, { Component, createContext } from 'react';
import { scaleLinear } from 'd3';

// Initialize context object for application state management
export const Context = createContext();

class Provider extends Component {
  state = {
    activeNode: null,
    activeLabel: null,
    brushRange: [],
    currentMatch: null,
    // authors: ['ericak', 'jimmyt'],
    authors: ['admin', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
    currentAuthor: 'admin',
    mapPaddingY: 120,
    mapPaddingX: 80,
    playing: false,
    playbackSpeed: 1,
    windowSettings: {
      width: null,
      height: null
    },
  };

  // On mount get match entries, load data, and initialize event listeners for window size update
  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
    this.getMatchEntries().then(() => this.loadNewData())
  }

  // If state change, filter events for map and timeline rendering
  componentDidUpdate(nextProps, nextState) {
    if ((nextState.selectedUnits !== this.state.selectedUnits) || (nextState.selectedEventTypes !== this.state.selectedEventTypes)) {
      let unitEventsFiltered = this.filterEvents()
      this.setState({
        unitEventsFiltered: unitEventsFiltered
      })
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  // Promise chain to laod data
  loadNewData = () => {
    this.getMatchData(this.state.currentMatch)
      .then(res => this.loadMatchData(res))
      .then(res => this.getEvents())
      .then(res => this.loadEvents(res))
      .then(res => this.props.toggleMapLoading())
  }

  // Get all available matches from database
  getMatchEntries = async () => {
    const response = await fetch('/api/matchentries', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message)
    }
    let matches = [];
    body.forEach((match) => matches.push(match.file_name))
    // Alphabetize and sort match titles
    matches.sort(function (a, b) {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    // Add matches to state and set current match to first in list
    this.setState({
      matches: [...matches],
      currentMatch: matches[0]
    })
  }

  // Retrieve match data for first in list
  getMatchData = async (match) => {
    const response = await fetch('/api/matches', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        matchId: match
      })
    });
    const body = await response.json();
    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  }

  // Format and load match data into state
  loadMatchData = (data) => {
    let unitsAll = [];
    let groups = [];
    // Get all units in data
    data[0].units.forEach((d) => {
      unitsAll.push(d.name)
    })
    // Get all groups in data
    data[0].groups.forEach((d) => {
      groups.push(d.name)
    })
    let eventsAllTypes = [];
    let eventsTimeline = [];
    let eventsTimelineObj = [];
    let eventsStatus = [];
    data[0].events.forEach((d) => {
      if (!eventsAllTypes.includes(d.event_type)) {
        eventsAllTypes.push(d.event_type)
      }
      if (d.timeline === true) {
        eventsTimeline.push(d.event_type)
        eventsTimelineObj.push(d)
      }
      if (d.status === true) {
        eventsStatus.push(d.event_type)
      }
    })
    let timelineHeight = eventsTimeline.length * 25
    data[0].groups.forEach((d, i) => {
      d.units = []
    })
    // Make group object for group state
    data[0].groups.forEach((d, i) => {
      data[0].units.forEach((e) => {
        if (e.group === d.name) {
          d.units.push(e.name)
        }
      })
    })
    // Make icon object for icon state
    let icons = {}
    data[0].events.forEach((event) => {
      icons[event.event_type] = event.icon
    })
    // Make tooltips object for tooltip state
    let tooltips = {}
    data[0].events.forEach((event) => {
      tooltips[event.event_type] = event.tooltip_context
    })
    let playbackRatio = (data[0].timestamp_range.end - data[0].timestamp_range.start) * .006

    // Set state with formatted data
    this.setState({
      coordinateRange: {
        x: {
          min: data[0].coordinate_range.x.min,
          max: data[0].coordinate_range.x.max
        },
        y: {
          min: data[0].coordinate_range.y.min,
          max: data[0].coordinate_range.y.max
        }
      },
      events: {
        all: [...data[0].events],
        allTypes: [...eventsAllTypes],
        timeline: [...eventsTimeline],
        timelineObj: [...eventsTimelineObj],
        status: [...eventsStatus]
      },
      groups: [...data[0].groups],
      icons: icons,
      loadSettings: data[0].load_settings,
      mapSettings: {
        width: data[0].map.map_width,
        height: data[0].map.map_height
      },
      matchId: data[0].match_id,
      playbackRatio: playbackRatio,
      timelineSettings: {
        height: timelineHeight
      },
      timestampRange: {
        start: data[0].timestamp_range.start,
        end: data[0].timestamp_range.end
      },
      tooltips: tooltips,
      units: [...data[0].units],
      unitsAll: [...unitsAll]
    })
  }

  // After match data is formatted and loaded, get event data
  getEvents = async () => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        matchId: this.state.currentMatch,
        unit: this.state.unitsAll,
        event_type: this.state.events.allTypes,
        timestampRange: this.state.timestampRange
      })
    });
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body.sort(this.compareTime)
  }

  // Load event data after retrieval
  loadEvents = (data) => {
    let unitEventsTimeline = data.filter(d => this.state.events.timeline.includes(d.event_type))
    let statusEventsFilteredByUnit = {};
    this.state.loadSettings.selected_units.forEach((unit) => {
      let filteredEvents = data.filter(event => event.unit === unit);
      let statusEventsFiltered = filteredEvents.filter(event => this.state.events.status.includes(event.event_type))
      statusEventsFilteredByUnit[unit] = statusEventsFiltered;
    })
    this.setState({
      unitEventsAll: [...data],
      unitEventsTimeline: [...unitEventsTimeline],
      selectedUnits: [...this.state.loadSettings.selected_units],
      selectedEventTypes: [...this.state.loadSettings.selected_events],
      statusEventsFilteredByUnit: statusEventsFilteredByUnit,
      unitEventsFiltered: 0
    })
  }

  // Filter event data based on user selection, function runs on each selection
  filterEvents = () => {
    let unitEventsBrushed = this.state.unitEventsTimeline.filter((e) => (e.timestamp > this.state.brushRange[0]) && (e.timestamp < this.state.brushRange[1]))
    let unitEventsFiltered = unitEventsBrushed.filter(event => (this.state.selectedUnits.includes(event.unit)))
    return unitEventsFiltered.filter(event => (this.state.selectedEventTypes.includes(event.event_type)))
  }

  // Retrieves labels from database and loads into state
  getLabels = async () => {
    const response = await fetch('/api/labels', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        match: this.state.currentMatch,
        author: this.state.currentAuthor
      })
    });
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message)
    }
    this.setState({
      labels: [...body]
    })
  }

  // On window resize, resize applicaiton
  updateWindowDimensions = () => {
    this.setState({
      windowSettings: {
        height: window.innerHeight,
        width: window.innerWidth
      }
    })
  }

  // Filter selected units state based on user input
  removeSelectedUnits = (original, remove) => {
    return original.filter(value => !remove.includes(value));
  }

  // Sort events based on timestamp
  compareTime = (a, b) => {
    if (a.timestamp < b.timestamp)
      return -1;
    if (a.timestamp > b.timestamp)
      return 1;
    return 0;
  }

  // d3 tick pattern for updating
  tick = (e) => {
    const { brushRange, timestampRange, playbackSpeed, playbackRatio } = this.state;
    if ((brushRange[0] <= timestampRange.start) || (brushRange[1] >= timestampRange.end)) {
      this.stopPlaying()
      return
    }
    if (e === 'stepforward') {
      this.setState(prevState => {
        return {
          brushRange: [prevState.brushRange[0] + (playbackSpeed * playbackRatio), prevState.brushRange[1] + (playbackSpeed * playbackRatio)]
        }
      }, () => this.stopPlaying())
    } else if (e === 'forward') {
      this.setState(prevState => {
        return {
          brushRange: [prevState.brushRange[0] + (playbackSpeed * playbackRatio), prevState.brushRange[1] + (playbackSpeed * playbackRatio)]
        }
      })
    } else if (e === 'stepbackward') {
      this.setState(prevState => {
        return {
          brushRange: [prevState.brushRange[0] - (playbackSpeed * playbackRatio), prevState.brushRange[1] - (playbackSpeed * playbackRatio)]
        }
      }, () => this.stopPlaying())
    }
  }

  // Stop playback
  stopPlaying = () => {
    this.setState({
      playing: false
    })
  }

  render() {
    return (
      // Context object
      // Functions in context are available throughout the application
      <Context.Provider value={{
        state: this.state,

        // Removes/adds selected event, based on user input
        toggleSelectedEvent: (event) => {
          if (this.state.selectedEventTypes.includes(event)) {
            const array = [...this.state.selectedEventTypes];
            const index = array.indexOf(event);
            array.splice(index, 1);
            this.setState({
              selectedEventTypes: array
            })
          } else {
            this.setState(prevState => ({
              selectedEventTypes: [...prevState.selectedEventTypes, event]
            }))
          }
        },

        // Redirect function, making getLabels available throughout application
        getLoadLabels: () => {
          this.getLabels()
        },

        // AddLabel, used by Label Panel
        addLabel: (label) => {
          if (this.state.brushRange.length === 0) {
            alert('Please make a brush selection.')
            return 'failure';
          } else if (!((label.title) && (label.author) && (label.description))) {
            alert('Please fill in all fields.')
            return 'failure';
          } else if (this.state.activeLabel) {
            alert('Please deactivate current label before adding a new one.')
            return 'failure';
          }
          let event_ids = [];
          this.state.unitEventsFiltered.forEach((event) => event_ids.push(event.node_id))
          let id = Math.floor(Math.random() * 1000000000)
          return fetch('api/add-label', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: id,
              title: label.title,
              author: this.state.currentAuthor,
              timestamp_range: [...this.state.brushRange],
              description: label.description,
              match: this.state.currentMatch,
              events: this.state.selectedEventTypes,
              units: this.state.selectedUnits,
              event_ids: event_ids
            })
          }).then(() => new Promise((resolve) => setTimeout(resolve, 350))).then(res => this.getLabels())
        },

        // Removes/adds selected unit, based on user input
        toggleSelectedUnit: (unit) => {
          if (this.state.selectedUnits.includes(unit)) {
            const array = [...this.state.selectedUnits];
            const index = array.indexOf(unit);
            array.splice(index, 1);
            this.setState({
              selectedUnits: array
            })
          } else {
            this.setState(prevState => ({
              selectedUnits: [...prevState.selectedUnits, unit]
            }))
          }
        },

        // Removes/adds selected groups, based on user input
        // Child units are also removed/added
        toggleGroup: (groupUnits) => {
          let newUnits = groupUnits.filter(unit => !this.state.selectedUnits.includes(unit))
          if (newUnits.length === 0) {
            let array = this.removeSelectedUnits(this.state.selectedUnits, groupUnits)
            this.setState({
              selectedUnits: array
            })
          } else {
            this.setState(prevState => ({
              selectedUnits: [...prevState.selectedUnits, ...newUnits]
            }))
          }
        },

        // d3 for scaling x values in the map
        // Maps x coordinates to window size
        xScale: (x) => {
          const scale = scaleLinear()
            .domain([this.state.coordinateRange.x.min, this.state.coordinateRange.x.max])
            .range([this.state.mapPaddingX, this.state.windowSettings.width - this.state.mapPaddingX])
          return scale(x)
        },

        // d3 for scaling y values in the map
        // Maps y coordinates to window size
        yScale: (y) => {
          const scale = scaleLinear()
            .domain([this.state.coordinateRange.y.min, this.state.coordinateRange.y.max])
            .range([this.state.windowSettings.width - this.state.mapPaddingY, this.state.mapPaddingY])
          return scale(y)
        },

        // d3 for scaling y values in the timeline
        // Maps y coordinates to timeline settings
        yScaleTime: (y) => {
          const scale = scaleLinear()
            .domain([0, this.state.events.timeline.length - 1])
            .range([14, this.state.timelineSettings.height - 12])
          return scale(y)
        },

        // On brush change, updates brush settings and filters events accordingly
        updateBrushRange: (e) => {
          this.setState({
            brushRange: [Math.round(e[0]), Math.round(e[1])]
          }, () => {
            let unitEventsFiltered = this.filterEvents()
            this.setState({
              unitEventsFiltered: unitEventsFiltered
            })
          })
        },

        // User selected node is activated in state
        toggleActiveNode: (node) => {
          this.setState({
            activeNode: node
          })
        },

        // On click, selects label and activates in state
        changeLabel: (label) => {
          if (label) {
            this.setState({
              activeLabel: label.id
            }, () => {
              this.setState({
                brushRange: [Math.round(label.timestamp_range[0]), Math.round(label.timestamp_range[1])],
                selectedUnits: [...label.units],
                selectedEventTypes: [...label.events],
                activeLabel: label.id
              })
            })
          } else {
            this.setState({
              activeLabel: null,
              selectedUnits: [...this.state.unitsAll],
              selectedEventTypes: [...this.state.events.timeline]
            })
          }
        },

        // State change for playback controls
        playback: (e) => {
          this.setState({
            playing: !this.state.playing
          }, () => {
            if (e === 'stepforward') {
              this.tick('stepforward')
            } else if (e === 'stepbackward') {
              this.tick('stepbackward')
            } else if (this.state.playing) {
              this.interval = setInterval(() => this.tick('forward'), 250);
            } else {
              clearInterval(this.interval)
            }
          })
        },

        // Stops playback
        stopPlayback: () => {
          this.stopPlaying()
          clearInterval(this.interval)
        },

        // Sets playback speed, based on user input
        playbackSpeed: (e) => {
          if (Math.abs(this.state.playbackSpeed) >= 2) {
            return
          }
          if (e === 'plus') {
            this.setState(prevState => ({
              playbackSpeed: prevState.playbackSpeed + .25
            }))
          } else if (e === 'minus') {
            this.setState(prevState => ({
              playbackSpeed: prevState.playbackSpeed - .25
            }))
          }
        },

        // Reorders label data, relayering and rerendering them in the SVG
        shuffleLabels: (e) => {
          let array = this.state.labels;
          if (e.which === 32) {
            array.sort(() => .5 - Math.random())
            this.setState({
              labels: array
            })
          }
        },

        // Mutes all other events, based on user input
        soloEvent: (event) => {
          if (event === 'toggle') {
            this.setState({
              selectedEventTypes: this.state.events.timeline
            })
          } else {
            let selectedEventArray = []
            selectedEventArray.push(event)
            this.setState({
              selectedEventTypes: selectedEventArray
            })
          }
        },

        // Sets the position of the tooltip, based on window size
        // Specific to amount of tooltip information
        // TODO rewrite to be dynamic to the incoming data
        setTooltipPosition: (e, event) => {
          let tooltipElements;
          if (event.node_context) {
            tooltipElements = (this.state.tooltips[event.event_type].length + Object.keys(event.node_context).length)
          } else {
            tooltipElements = this.state.tooltips[event.event_type].length
          }
          let tooltipHeight = tooltipElements * 28
          let x = e.screenX;
          let y = e.screenY;
          if ((x + 300) > this.state.windowSettings.width) {
            x -= 315;
          } else {
            x += 15
          }
          if ((Math.abs(y) + (tooltipHeight)) < (this.state.windowSettings.height)) {
            y -= tooltipHeight * .2
          } else {
            y -= tooltipHeight * 1.2
          }
          this.setState({
            tooltipPosition: [x, y]
          })
        },

        //disable brush before match changes to destroy map data
        setCurrentMatch: (e) => {
          this.setState({
            activeLabel: null,
            currentMatch: e
          }, () => {
            this.props.toggleMapLoading()
            this.loadNewData();
          })
        },

        setCurrentAuthor: (e) => {
          this.setState({
            currentAuthor: e
          }, () => {
            this.props.toggleMapLoading()
            this.loadNewData();
          })
        },

        // Get the activate unit data object
        getUnit: (unit) => {
          let unitObject;
          this.state.units.forEach((d) => {
            if (d.name === unit) {
              unitObject = d
            }
          })
          return unitObject
        },

        // Search through label data and set it in state
        searchLabels: (content) => {
          let searchArray = [];
          for (let i in content) {
            if (content[i] !== '') {
              searchArray.push(content[i])
            }
          }
          if (searchArray.length === 0) {
            this.setState({
              labelSearch: null
            })
          } else {
            this.setState({
              labelSearch: searchArray
            })
          }
        },

        // Formats strings
        formatFirstString(string) {
          string = string.replace(/_/g, " ")
          string = string.replace(/npcdota/g, "")
          string = string.replace(/hero/g, "")
          string = string.charAt(0).toUpperCase() + string.slice(1);
          return string;
        },

        // Formats items
        formatItemList(array) {
          array.forEach((a, i) => {
            array[i] = a.replace(/item_/g, "").replace(/_/g, " ")
          })
          array = array.join(', ')
          return array
        }
      }
      } >
        {this.props.children}
      </ Context.Provider >
    )
  }
}

export default Provider;
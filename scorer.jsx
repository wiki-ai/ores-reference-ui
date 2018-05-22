import React from 'react';
import { render } from 'react-dom';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { Button, Checkbox, Collapsible, Input } from 'wikipedia-react-components';
import 'wikipedia-react-components/dist/styles.css';
import { action, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import Chart from 'chart.js';
import { RingLoader } from 'react-spinners';
import Collapse, { Panel } from 'rc-collapse';
import 'rc-collapse/assets/index.css';

// TODO: configurable
const oresUri = 'https://ores.wikimedia.org';
// const oresUri = "http://localhost:5000";

var appState = observable( {
	// Current UI input values.
	wiki: null,
	models: [],
	revisions: [],
	includeModelInfo: false,
	includeThresholdInfo: false,

	// Capabilities of this ORES installation.
	allModels: {},
	wikis: [],
	get wikiModels() {
		if (
			!appState.allModels ||
			!appState.wiki ||
			!appState.allModels[ appState.wiki ]
		) {
			return [];
		}
		return Object.keys( appState.allModels[ appState.wiki ].models );
	},

	// ORES request and results.
	scoringRequest: null,
	scoringResponse: null,
	loading: false
} );

class OresApi {
	// TODO: decouple from appState

	static loadWikisAndModels() {
		fetch( oresUri + '/v3/scores/' )
			.then( res => res.json() )
			.then( action( json => {
				appState.allModels = json;
				appState.wikis = Object.keys( json );
			} ) );
	}

	@action
	static requestScores() {
		let url = new URL( oresUri + '/v3/scores/' + appState.wiki + '/' ),
			params = new URLSearchParams(),
			modelInfo = [],
			modelString,
			revisionString;

		if ( appState.models.length > 0 ) {
			modelString = appState.models.join( '|' );
			params.append( 'models', modelString );
		}

		if ( appState.revisions.length > 0 ) {
			revisionString = appState.revisions.join( '|' );
			params.append( 'revids', revisionString );
		}

		// FIXME: I don't think we can request multiple types of model info in
		// one request.
		if ( appState.includeModelInfo === true ) {
			modelInfo.push( 'statistics' );
		}
		if ( appState.includeThresholdInfo === true ) {
			modelInfo.push( 'statistics.thresholds' );
		}
		if ( modelInfo.length > 0 ) {
			params.append( 'model_info', modelInfo.join( '|' ) );
		}

		// TODO: "|" gets url-encoded but it would be clearer if we didn't.
		url.search = params;
		appState.scoringRequest = url.toString();
		appState.loading = true;

		fetch( appState.scoringRequest )
			.then( res => res.json() )
			.then( action( json => {
				appState.scoringResponse = json;
				appState.loading = false;
			} ) );
	}
}

// TODO: These must already be a thing?
class OptionsHelper {
	static toArray( options ) {
		return options.map( option => { return option.value; } );
	}

	static fromArray( values ) {
		return values.map(
			( key ) => {
				return {
					label: key,
					value: key
				};
			} );
	}
}

@observer
class WikiChooser extends React.Component {
	render() {
		let value = this.props.appState.wiki || null,
			options = OptionsHelper.fromArray( toJS( this.props.appState.wikis ) );

		return (
			<div>
				<h5>Select wiki</h5>
				<Select
					onChange={ this.handleChange.bind( this ) }
					value={ value }
					options={ options }
				/>
			</div>
		);
	}

	@action
	handleChange( selectedOption ) {
		// FIXME: handle null better
		if ( selectedOption === null ) {
			this.props.appState.wiki = null;
		} else {
			this.props.appState.wiki = selectedOption.value;
		}
	}
}

@observer
class ModelChooser extends React.Component {
	render() {
		if ( !this.props.appState.wikiModels.length ) {
			return null;
		}

		let selectedOptions = OptionsHelper.fromArray( this.props.appState.models ),
			options = OptionsHelper.fromArray( this.props.appState.wikiModels );

		return (
			<div>
				<h5>Select models (optional)</h5>
				<Select
					multi={ true }
					placeholder="All models"
					value={ selectedOptions }
					onChange={ this.handleChange.bind( this ) }
					options={ options }
				/>
			</div>
		);
	}

	@action
	handleChange( selectedOptions ) {
		let options = OptionsHelper.toArray( selectedOptions );
		this.props.appState.models = options;
	}
}

@observer
class ModelInfoChooser extends React.Component {
	render() {
		if ( this.props.appState.wiki === null ) {
			return null;
		}

		return (
			<div>
				<h5>Model info</h5>
				<Checkbox
					label="Include basic model statistics"
					checked={ this.props.appState.includeModelInfo }
					onToggle={ this.handleToggleModelInfo.bind( this ) }
				/><br />
				<Checkbox
					label="Graph threshold statistics"
					checked={ this.props.appState.includeThresholdInfo }
					onToggle={ this.handleToggleThresholdInfo.bind( this ) }
				/>
			</div>
		);
	}

	@action
	handleToggleModelInfo() {
		this.props.appState.includeModelInfo = !this.props.appState.includeModelInfo;
	}

	@action
	handleToggleThresholdInfo() {
		this.props.appState.includeThresholdInfo = !this.props.appState.includeThresholdInfo;
	}
}

@observer
class RevisionChooser extends React.Component {
	render() {
		if ( !this.props.appState.wiki ) {
			return null;
		}

		// TODO: join with newline
		let revisions = this.props.appState.revisions;

		// TODO: current recommendation seems to be s/onInput/onChange/

		return (
			<div>
				<h5>Choose revision(s) by ID (separated by a newline)</h5>
				<Input
					onInput={ this.handleChange.bind( this ) }
					value={ revisions }
					textarea={ true }
				/>
			</div>
		);
	}

	@action
	handleChange( event ) {
		let value = event.target.value,
			// TODO: split on comma and space as well.
			revisions = value.split( '\n' );
		this.props.appState.revisions = revisions;
	}
}

@observer
class SendButton extends React.Component {
	render() {
		// TODO: move to isInputValid, explain.
		if (
			this.props.appState.wiki === null ||
			( this.props.appState.revisions.length === 0 &&
				!this.props.appState.includeModelInfo &&
				!this.props.appState.includeThresholdInfo )
		) {
			return null;
		}

		return (
			<div>
				<Button
					onClick={ this.handleClick.bind( this ) }
					label="Give me results!"
				/>
				<RingLoader
					loading={this.props.appState.loading}
				/>
			</div>
		);
	}

	@action
	handleClick() {
		OresApi.requestScores();
	}
}

@observer
class RawRequest extends React.Component {
	render() {
		let url = this.props.appState.scoringRequest;

		if ( !url ) {
			return null;
		}

		return (
			<div>
				<h5>Scoring request</h5>
				<a href={ url }>{ url }</a>
			</div>
		);
	}
}

@observer
class RawResults extends React.Component {
	render() {
		if ( !this.props.appState.scoringResponse ) {
			return null;
		}

		let json = JSON.stringify( toJS( this.props.appState.scoringResponse ), null, 4 );

		return (
			<Collapse accordion={ true }>
				<Panel header="Raw results" key="0">
					<pre>
						{ json }
					</pre>
				</Panel>
			</Collapse>
		);
	}
}

@observer
class RenderedResults extends React.Component {
	render() {
		if (
			!this.props.appState.scoringResponse ||
			!this.props.appState.scoringResponse[ this.props.appState.wiki ]
		) {
			return null;
		}

		let models = this.props.appState.scoringResponse[ this.props.appState.wiki ].models;

		// TODO: does forEach map?  How to more elegantly iterate objects?

		return (
			<div>
				{ Object.keys( toJS( models ) ).filter( model => {
					return Boolean( models[ model ].statistics ) &&
						Boolean( models[ model ].statistics.thresholds );
				} ).map( model => {
					let thresholds = models[ model ].statistics.thresholds;

					return Object.keys( thresholds ).map( target => {
						return (
							<ThresholdGraph
								key={ model + '-' + target }
								wiki={ this.props.appState.wiki }
								model={ model }
								thresholds={ thresholds[ target ] }
								target={ target }
							/>
						);
					} );
				} ) }
			</div>
		);
	}
}

class ThresholdGraph extends React.Component {
	componentDidMount() {
		let chartCanvas = this.refs.chart,
			data = {
				datasets: [
					{
						label: 'Precision',
						data: this.props.thresholds.map( level => {
							return { x: level.threshold, y: level.precision };
						} ),
						borderColor: 'rgba( 0, 204, 255, 1 )',
						pointRadius: 0
					},
					{
						label: 'Recall',
						data: this.props.thresholds.map( level => {
							return { x: level.threshold, y: level.recall };
						} ),
						borderColor: 'rgba( 134, 153, 77, 1 )',
						pointRadius: 0
					},
					{
						label: 'Filter rate',
						data: this.props.thresholds.map( level => {
							return { x: level.threshold, y: level.filter_rate };
						} ),
						borderColor: 'rgba( 0, 0, 0, 1 )',
						pointRadius: 0
					}
				]
			};

		/* eslint-disable no-new */
		new Chart( chartCanvas, {
			type: 'line',
			data: data,
			options: {
				title: {
					display: true,
					text: 'Precision-recall for ' + this.props.wiki + ' ' + this.props.model + ' "' + this.props.target + '" prediction'
				},
				elements: {
					line: {
						tension: 0, // disables bezier curves
						fill: false
					}
				},
				scales: {
					xAxes: [ {
						scaleLabel: {
							display: true,
							labelString: 'Cutoff threshold'
						},
						type: 'linear',
						position: 'bottom'
					} ]
				}
			}
		} );
	}

	render() {
		if ( !this.props.thresholds ) {
			return null;
		}

		return (
			<canvas ref={ 'chart' } height="400" width="600"></canvas>
		);
	}
}

OresApi.loadWikisAndModels();

render(
	<div>
		<WikiChooser appState={appState} />
		<ModelChooser appState={appState} />
		<RevisionChooser appState={appState} />
		<ModelInfoChooser appState={appState} />
		<SendButton appState={appState} />
		<RawRequest appState={appState} />
		<RawResults appState={appState} />
		<RenderedResults appState={appState} />
	</div>,
	document.getElementById( 'root' )
);

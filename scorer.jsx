import React from 'react';
import { render } from 'react-dom';

import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { Button, Checkbox, Input } from 'wikipedia-react-components';
import 'wikipedia-react-components/dist/styles.css';
import { RingLoader } from 'react-spinners';
import Collapse, { Panel } from 'rc-collapse';
import 'rc-collapse/assets/index.css';

import { action, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';

import OptionsHelper from './options_helper.jsx';
import PredictionGraph from './prediction_graph.jsx';
import ThresholdGraph from './threshold_graph.jsx';

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
	// TODO: Make this default configurable.
	oresServer: 'https://ores.wikimedia.org',
	scoringRequest: null,
	scoringResponse: null,
	loading: false
} );

class OresApi {
	// TODO: decouple from appState

	static loadWikisAndModels() {
		fetch( appState.oresServer + '/v3/scores/' )
			.then( res => res.json() )
			.then( action( json => {
				appState.allModels = json;
				appState.wikis = Object.keys( json );
			} ) );
	}

	@action
	static requestScores() {
		let url = new URL( appState.oresServer + '/v3/scores/' + appState.wiki + '/' ),
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

@observer
class ServerChooser extends React.Component {
	render() {
		return (
			<div>
				<h5>ORES server URI</h5>
				<Input
					onInput={ this.handleChange.bind( this ) }
					defaultValue={ this.props.appState.oresServer }
				/>
			</div>
		);
	}

	@action
	handleChange( event ) {
		this.props.appState.oresServer = event.target.value;

		// TODO: Observe instead.
		OresApi.loadWikisAndModels();
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
			revisions = value.trim().split( '\n' );
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

		let wikiResponse = this.props.appState.scoringResponse[ this.props.appState.wiki ],
			scoresResponse = wikiResponse.scores,
			models = wikiResponse.models,
			thresholdGraphs = Object.keys( toJS( models ) )
				.filter( model => {
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
				} ),
			scoreGraphs = null;

		if ( scoresResponse ) {
			scoreGraphs = Object.keys( scoresResponse ).map( rev_id => {
				return Object.keys( scoresResponse[ rev_id ] ).map( model => {
					if ( scoresResponse[ rev_id ][ model ].error ) {
						return <p>{ scoresResponse[ rev_id ][ model ].error.message }</p>;
					}
					return (
						<PredictionGraph
							key={ model + '-' + rev_id }
							wiki={ this.props.appState.wiki }
							model={ model }
							rev_id={ rev_id }
							score={ toJS( scoresResponse[ rev_id ][ model ].score ) }
						/>
					);
				} );
			} );
		}

		// TODO: does forEach map?  How to more elegantly iterate objects?

		return (
			<div>
				{ scoreGraphs }
				{ thresholdGraphs }
			</div>
		);
	}
}

OresApi.loadWikisAndModels();

render(
	<div>
		<ServerChooser appState={ appState } />
		<WikiChooser appState={ appState } />
		<ModelChooser appState={ appState } />
		<RevisionChooser appState={ appState } />
		<ModelInfoChooser appState={ appState } />
		<SendButton appState={ appState } />
		<RawRequest appState={ appState } />
		<RawResults appState={ appState } />
		<RenderedResults appState={ appState } />
	</div>,
	document.getElementById( 'root' )
);

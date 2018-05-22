import React from 'react';
import { render } from 'react-dom';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { Button, Input } from 'wikipedia-react-components';
import 'wikipedia-react-components/dist/styles.css';
import { action, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';

// TODO: configurable
const oresUri = 'https://ores.wikimedia.org';
// const oresUri = "http://localhost:5000";

var appState = observable( {
	// Current UI input values.
	wiki: null,
	models: [],
	revisions: [],

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
	scoringResponse: null
} );

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

/*
function getParameterByName( name ) {
	var regex = null, results = null;

	name = name.replace( /[[]/, '\\[' ).replace( /[\]]/, '\\]' );
	regex = new RegExp( '[\\?&]' + name + '=([^&#]*)' );
	results = regex.exec( location.search );
	return results === null ? '' : decodeURIComponent( results[ 1 ].replace( /\+/g, ' ' ) );
}

function error( msg ) {
	var htm = '<div class="alert alert-danger" style="padding-top: 15px"><div class="header">We\'re sorry. ORES returned the following error:</div><p>' + msg + '</p></div>';
	return htm;
}
*/

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
					options={ options } />
			</div>
		);
	}

	@action
	handleChange( selectedOption ) {
		// FIXME: handle null better
		if ( selectedOption === null ) {
			this.props.appState.wiki = null;
		}
		this.props.appState.wiki = selectedOption.value;
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
					options={ options } />
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
					textarea={ true } />
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
		// TODO: move to isInputValid
		if (
			this.props.appState.wiki === null ||
			this.props.appState.revisions.length === 0
		) {
			return null;
		}

		return <Button
			onClick={ this.handleClick.bind( this ) }
			label="Give me results!" />;
	}

	@action
	handleClick() {
		let selectedModels = toJS( this.props.appState.models ),
			modelString,
			revisionString;

		if ( selectedModels.length === 0 ) {
			selectedModels = this.props.appState.wikiModels;
		}
		modelString = selectedModels.join( '|' );
		revisionString = this.props.appState.revisions.join( '|' );

		this.props.appState.scoringRequest = oresUri + '/v3/scores/' +
			this.props.appState.wiki + '/?models=' + modelString + '&revids=' + revisionString;

		fetch( this.props.appState.scoringRequest )
			.then( res => res.json() )
			.then( action( json => {
				this.props.appState.scoringResponse = json;
			} ) );
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
				Scoring request: <a href={ url }>{ url }</a>
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
			<div>
				Raw results:
				<pre>
					{ json }
				</pre>
			</div>
		);
	}
}

/*

function createTable( data ) {
	var htm = '', i = 0, j = 0, k = 0, revids = [], outcomes = [], models = [];

	htm = '<table class="celled table sortable"><thead><tr><th>Wiki</th><th>Model</th><th>Revision ID</th><th>Value</th><th>Score</th></tr></thead>';
	revids = Object.keys( data );
	if ( data.responseJSON && data.responseJSON.error ) {
		return error( data.responseJSON.error.message );
	}
	for ( i = 0; i < revids.length; i++ ) {
		if ( data[ revids[ i ] ].error ) {
			return error( data[ revids[ i ] ].error.message );
		}
		models = Object.keys( data[ revids[ i ] ] );
		for ( j = 0; j < models.length; j++ ) {
			if ( data[ revids[ i ] ][ models[ j ] ].error ) {
				return error( data[ revids[ i ] ][ models[ j ] ].error.message );
			}
			outcomes = Object.keys( data[ revids[ i ] ][ models[ j ] ].probability );
			for ( k = 0; k < outcomes.length; k++ ) {
				htm += '<tr><td>' + $( '#wikiDropDownInput' ).attr( 'value' ) + '</td><td>' + models[ j ] + '</td><td>' + revids[ i ] + '</td><td>' + outcomes[ k ] + '</td><td>' + data[ revids[ i ] ][ models[ j ] ].probability[ outcomes[ k ] ] + '</td></tr>';
			}
		}
	}
	htm += '</tbody></table>';
	return htm;
}

if ( getParameterByName( 'revids' ) ) {
	$( function () {
		setTimeout( function () {
			$( '#revIds' ).val( getParameterByName( 'revids' ).replace( '|', ',' ) );
		}, 3000 );
	} );
}

if ( getParameterByName( 'models' ) ) {
	urlModels = getParameterByName( 'models' ).split( '|' );
	$( function () {
		setTimeout( function () {
			var i = 0;
			for ( i = 0; i < urlModels.length; i++ ) {
				$( ':input[value="' + urlModels[ i ] + '"]' ).prop( 'checked', true );
			}
		}, 3000 );
	} );
}

if ( getParameterByName( 'wiki' ) && getParameterByName( 'revids' ) && getParameterByName( 'models' ) ) {
	if ( getParameterByName( 'go' ) ) {
		$( function () { setTimeout( function () { getResults(); }, 3000 ); } );
	}
	$( function () { setTimeout( function () { enableResult(); }, 3000 ); } );
}
*/

function loadWikisAndModels() {
	fetch( oresUri + '/v3/scores/' )
		.then( res => res.json() )
		.then( action( json => {
			appState.allModels = json;
			appState.wikis = Object.keys( json );
		} ) );
}

render(
	<div>
		<WikiChooser appState={appState} />
		<ModelChooser appState={appState} />
		<RevisionChooser appState={appState} />
		<SendButton appState={appState} />
		<RawRequest appState={appState} />
		<RawResults appState={appState} />
	</div>,
	document.getElementById( 'root' )
);

loadWikisAndModels();

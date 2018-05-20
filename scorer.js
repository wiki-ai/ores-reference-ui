import React from 'react';
import { render } from 'react-dom';

import Select from 'react-select';
import 'react-select/dist/react-select.css';

import { Button, Input } from 'wikipedia-react-components';

import { action, computed, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';


// TODO: configurable
// const oresUri = "https://ores.wikimedia.org";
const oresUri = "http://localhost:5000";

var appState = observable( {
    wiki: null,
    models: [],
    revisions: [],

    allModels: {},
    wikis: [ "enwiki", "frwiki" ],
    @computed get wikiModels() {
        if ( appState.allModels === null || appState.wiki === null ) {
            return [];
        }
        return Object.keys( appState.allModels[appState.wiki].models );
    }
} );
//var urlModels = [];

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
        let value = this.props.appState.wiki || null;

        let options = this.props.appState.wikis.map(
            (key) => { return {
                label: key,
                value: key
            } } );

        return (
            <div>
                <h5>Select wiki</h5>
                <Select
                    onChange={ this.handleChange.bind(this) }
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

// TODO: These must exist already.
function optionsToArray( options ) {
    return options.map( option => { return option.value } );
}

function arrayToOptions( values ) {
    return values.map(
        (key) => { return {
            label: key,
            value: key
        } } );
}

@observer
class ModelChooser extends React.Component {
    render() {
        if ( !this.props.appState.wikiModels.length ) {
            return null;
        }

        let selectedOptions = arrayToOptions( this.props.appState.models );
        let options = arrayToOptions( this.props.appState.wikiModels );

        return (
            <div>
                <h5>Select models (optional)</h5>
                <Select
                    multi={ true }
                    placeholder="All models"
                    value={ selectedOptions }
                    onChange={ this.handleChange.bind(this) }
                    options={ options } />
            </div>
        );
    }

    handleChange( selectedOptions ) {
        let options = optionsToArray( selectedOptions );
        this.props.appState.models = options;
    }
}

class RevisionChooser extends React.Component {
    render() {
        if ( !this.props.appState.wiki ) {
            return null;
        }

        return (
            <div>
                <h5>Choose revision by ID</h5>
                <Input
                    textarea={ true } />
            </div>
        );
    }
}

class SendButton extends React.Component {
    render() {
        // TODO: move to isInputValid
        if (
            !this.props.appState.wiki ||
            !this.props.appState.models.length ||
            !this.props.appState.revisions.length
        ) {
            return null;
        }

        return <Button
            label="Give me results!" />;
    }
}

/*
function wikis() {
	$.get( '/scores/', function ( data ) {
		var wikis = data.contexts, i = 0;
		for ( i = 0; i < wikis.length; i++ ) {
			$( '#wikis' ).append( '<li><a>' + wikis[ i ] + '</a></li>' );
		}
		$( '#wikiDropDownInput' ).removeAttr( 'disabled' );
		// $( '#wikisList li > a' ).click( function () {
			// loadModels( this.innerHTML );
		// } );
	} );
}

function enableResult() {
	$( '#resultButton' ).removeAttr( 'disabled' );
}
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

function getResults() {
	var revs = $( '#revIds' ).val().replace( ',', '|' ), modelsUrl = '', url = '', container = '<div id="tableContainer" class="col-md-6 col-md-offset-3" style="margin-top: 3em; margin-bottom: 3em;">';

	var selectedModels = $( 'input:checked' );
	if ( selectedModels.length === 0 ) {
		selectedModels = $( ':checkbox' );
	}
	selectedModels.each( function () {
		modelsUrl += $( this ).val() + '|';
	} );

	modelsUrl = modelsUrl.slice( 0, -1 );
	url = '/scores/' + $( '#wikiDropDownInput' ).attr( 'value' ) + '/?models=' + modelsUrl + '&revids=' + revs;

	// Display the API we'll be using.
	var absoluteUrl = window.location.href + url;
	$( '#api-url' ).html( "Raw: <a href=\"" + url + "\">" + absoluteUrl + "</a>" );

	// Get the results.
	$.get( { url: url, datatype: 'jsonp' } ).always( function ( data ) {
		$( '#tableContainer' ).remove();
		$( '#afterThis' ).after( container + createTable( data ) + '</div>' );
		$( '.sortable.table' ).tablesorter();
	} );
}

wikis();
$( '#revIds' ).click( function () {
	enableResult();
} );
$( '#resultButton' ).click( function () {
	getResults();
} );
// if ( getParameterByName( 'wiki' ) ) {
// 	$( function () {
// 		loadModels( getParameterByName( 'wiki' ) );
// 	} );
// }

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

const loadWikisAndModels = function() {
    const response = {
        enwiki: {
            models: {
                damaging: { version: '0.4.0' },
                goodfaith: { version: '0.4.0' },
                wp10: { version: '0.4.0' },
            }
        }
    };

    appState.allModels = response;
    appState.wikis = Object.keys( response );

    /*
    fetch( oresUri + '/v3/scores/' )
        .then( res => res.json() )
        .then( action( json => {
            appState.allModels = json;
            appState.wikis = Object.keys( json );
        } ) );
    */
};

render(
    <div>
        <WikiChooser appState={appState} />
        <ModelChooser appState={appState} />
        <RevisionChooser appState={appState} />
        <SendButton appState={appState} />
    </div>,
    document.getElementById( 'root' )
);

loadWikisAndModels();

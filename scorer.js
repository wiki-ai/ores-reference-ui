import React from 'react';
import { render } from 'react-dom';
import Select from 'react-select';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';

// TODO: configurable
const oresUri = "https://ores.wikimedia.org";

var appState = observable( {
    wiki: "enwiki",
    wikiModels: [],
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
class ModelChooser extends React.Component {
    render() {
        if ( !this.props.appState.wikiModels.length ) {
            return null;
        }

        return (
            <div>
                <h5>Select models</h5>
                <Select multi options={this.props.appState.wikiModels} />
            </div>
        );
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

const loadModels = function() {
    fetch( oresUri + '/v3/scores/' + appState.wiki + '/' )
        .then( res => res.json() )
        .then( action( json => {
            console.log(json);
            appState.wikiModels = Object.keys( json[appState.wiki].models );
            console.log(appState.wikiModels);
        } ) );
};

render(
    <ModelChooser appState={appState} />,
    document.getElementById( 'root' )
);

loadModels()

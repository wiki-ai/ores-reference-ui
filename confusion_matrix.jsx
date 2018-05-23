import React, { Component } from 'react';
import Chart from 'chart.js';

class ColorBuilder {
	// TODO: better and accessible pallete.

	static buildCorrect( normalized ) {
		let val = 255 - Math.floor( normalized * 255.0 );
		return 'rgb(' + val + ', ' + val + ', ' + val + ')';
	}

	static buildIncorrect( normalized ) {
		let val = 255 - Math.floor( normalized * 255.0 );
		return 'rgb(' + val + ', ' + val + ', ' + val + ')';
	}
}

class ConfusionMatrix extends Component {
	componentDidMount() {
		let chartCanvas = this.refs.chart,
			cells =
				Object.keys( this.props.counts.predictions ).map( actual => {
					let targetCount = this.props.counts.labels[ actual ],
						cellColors = Object.keys( this.props.counts.predictions[ actual ] ).map( predicted => {
						let cellCount = this.props.counts.predictions[ actual ][ predicted ],
							cellNormalized = cellCount / targetCount,
							isCorrectDiagonal = actual === predicted,
							cellColor = isCorrectDiagonal ?
								ColorBuilder.buildCorrect( cellNormalized ) :
								ColorBuilder.buildIncorrect( cellNormalized );

							// label: actual + ' -> ~' + predicted,

							return cellColor;
						} );

					return {
						label: actual,
						data: Object.keys( this.props.counts.predictions[ actual ] ).map( _ => { return 1; } ),
						backgroundColor: cellColors,
						stack: 'confusion'
					};
				} ),
			data = {
				labels: Object.keys( this.props.counts.labels ).map( label => { return '~' + label; } ),
				datasets: cells
			};

		/* eslint-disable no-new */
		new Chart( chartCanvas, {
			type: 'horizontalBar',
			data: data,
			options: {
				title: {
					display: true,
					text: 'Confusion matrix for ' + this.props.wiki + ' ' + this.props.model + ' model'
				},
				legend: {
					display: false
				},
				scales: {
					xAxes: [ {
						// TODO: until we can display categories on the x-axis
						display: false
					} ],
					yAxes: [ {
						stacked: true,
						barPercentage: 1.0,
						categoryPercentage: 1.0
					} ]
				}
			}
		} );
	}

	render() {
		return (
			<canvas ref={ 'chart' } height="400" width="400"></canvas>
		);
	}
}

export default ConfusionMatrix;

import React, { Component } from 'react';
import Chart from 'chart.js';

class ThresholdGraph extends Component {
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

export default ThresholdGraph;

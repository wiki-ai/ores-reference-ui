import React, { Component } from 'react';
import Chart from 'chart.js';

class PredictionGraph extends Component {
	componentDidMount() {
		let chartCanvas = this.refs.chart,
			data = {
				labels: Object.keys( this.props.score.probability ),
				datasets: [
					{
						label: 'Revision ' + this.props.rev_id,
						data: Object.values( this.props.score.probability ),
						// TODO: pallete
						backgroundColor: 'rgb(50, 50, 50)'
					},
				]
			};

		/* eslint-disable no-new */
		new Chart( chartCanvas, {
			type: 'bar',
			data: data,
			options: {
				title: {
					display: true,
					text: this.props.model + ' prediction for revision ID ' + this.props.rev_id + ' on ' + this.props.wiki
				}
			}
		} );
	}

	render() {
		return (
			<canvas ref={ 'chart' } height="400" width="600"></canvas>
		);
	}
}

export default PredictionGraph;

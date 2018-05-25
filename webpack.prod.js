const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = {
	entry: {
		app: './index.js'
	},
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.jsx$/,
                use: {
                    loader: 'babel-loader'
                }
			},
			{
				test: /\.js$/,
                use: {
                    loader: 'babel-loader'
                }
			},
            {
                test: /\.css$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' }
                ]
            }
		]
	},
	plugins: [
		new CleanWebpackPlugin(['dist']),
        new MinifyPlugin( {
            mangle: { topLevel: true }
        } )
	],
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
};

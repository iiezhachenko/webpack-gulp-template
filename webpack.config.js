'use strict';

var path = require('path'),
    webpack = require('webpack'),
    ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = function (props) {

    var config = {
        context: path.join(__dirname, props.src),
        entry: {
            app: ["./main.js"],
            vendor: ['jquery']
        },
        output: {
            path: path.join(__dirname, props.target),
            filename: props.dev ? '[name].js' : '[chunkhash].[name].js',
            chunkFilename: props.dev ? '[id].[name].js' : '[id].[chunkhash].[name].js'
        },
        module: {
            loaders: [
                {test: /\.(js|jsx)$/,exclude: /(node_modules|bower_components)/, loader: 'babel?stage=0'},
                {
                    test: /\.less$/, loader: props.dev ? 'style-loader!css-loader!less-loader' :
                    ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
                },
                {test: /\.woff?$/, loader: "url?limit=10000&mimetype=application/font-woff"},
                {test: /\.woff2?$/, loader: "url?limit=10000&mimetype=application/font-woff2"},
                {test: /\.ttf?$/, loader: "url?limit=10000&mimetype=application/octet-stream"},
                {test: /\.eot?$/, loader: "file"},
                {test: /\.svg?$/, loader: "url?limit=10000&mimetype=image/svg+xml"},
                {test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'} // inline base64 URLs for <=8k images, direct URLs for the rest
            ]
        },
        devServer: {
            contentBase: props.target,
            hot: true
        },
        plugins: [
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            }),

            new webpack.optimize.CommonsChunkPlugin("vendor", props.dev ? '[name].js' : '[id].[chunkhash].[name].js')
        ]
    };

    if (props.dev) {
        config.plugins.push(
            new webpack.HotModuleReplacementPlugin()
        );
    } else {
        config.plugins.push(
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                }
            }),

            new webpack.optimize.DedupePlugin(),

            new ExtractTextPlugin('styles.css')

        );
    }

    return config;
};

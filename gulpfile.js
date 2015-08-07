var gulp = require('gulp'),
    webpack = require('webpack'),
    util = require('util'),
    path = require('path'),
    webpackConfig = require('./webpack.config.js'),
    WebpackDevServer = require('webpack-dev-server'),
    plugins = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'gulp.*', 'del']
    }),
    gutil = require('gulp-util'),
    props = {
        src: "src",
        target: "build",
        host: "localhost",
        port: 8080
    };

gulp.task('build:resources', ['clean'], function(){
    gulp.src(props.src + "/**/*.{png,jpg,ttf,woff,eof,svg}")
        .pipe(gulp.dest(props.target));
});

function cleanUp(path){
    var deleted = plugins.del.sync(path);
    if (deleted.length > 0){
        gutil.log("Deleted files/folders:\n", deleted.join("/n"));
    }
}

function chunkName(json, name, ext) {
    var chunk = json.assetsByChunkName[name];
    if (util.isArray(chunk)) {
        chunk = chunk.filter(function (filename) {
            return path.extname(filename).toLowerCase() === ext
        }).shift();
    }
    return chunk;
}

gulp.task("default", ["develop"]);

gulp.task('clean', function() {
    cleanUp(props.target);
});

gulp.task("develop", ['clean'], function(){
    gulp.start('build:resources');
    gulp.src(props.src + "/index-dev.html")
        .pipe(plugins.rigger())
        .pipe(plugins.rename("index.html"))
        .pipe(gulp.dest(props.target));
    props.dev = true;
    var url = 'http://' + props.host + ':' + props.port;
    var dev = Object.create(webpackConfig(props));
    console.log("Dev config");
    console.log(JSON.stringify(dev));
    dev.devtool = 'eval';
    dev.debug = true;
    dev.entry.app.push('webpack/hot/dev-server',
        'webpack-dev-server/client?' + url);
    new WebpackDevServer(webpack(dev), {
        contentBase: dev.devServer.contentBase,
        hot: dev.devServer.hot
    }).listen(props.port, props.host, function(err) {
            if (err) throw new gutil.PluginError('webpack-dev-server', err);
            gutil.log ('[webpack-dev-server]', url + '/webpack-dev-server/index-dev.html');
        })
});

gulp.task("prod", ['clean'], function(done) {
    gulp.start('build:resources');
    gulp.src(props.src + "/index.html")
        .pipe(plugins.rigger())
        .pipe(gulp.dest(props.target));
    props.dev = false;
    var prod = Object.create(webpackConfig(props));
    new webpack(prod, function (err, stats) {
        gutil.log('[webpack:build]', stats.toString());
        if (err) throw new gutil.PluginError('webpack:build', err);
        var json = stats.toJson();
        if (json.errors.length > 0)
            throw new gutil.PluginError('webpack:build', json.errors);
        if (json.warnings.length > 0)
            throw new gutil.PluginError('webpack:build', json.warnings);
        gulp.src(props.src + '/index.html')
            .pipe(plugins.rigger())
            .pipe(plugins.replace(/vendor\.js/, chunkName(json, 'vendor', '.js')))
            .pipe(plugins.replace(/app\.js/, chunkName(json, 'app', '.js')))
            .pipe(gulp.dest(props.target));
    });
    done();
});
var gulp = require('gulp');
var gutil = require("gulp-util");
var bower = require('gulp-bower');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var typings = require("gulp-typings");

var webpack = require('webpack');

var tsProject = ts.createProject('scripts/ts/tsconfig.json');

gulp.task('bower', function() {
  return bower();
});

gulp.task("typings", function(){
    return gulp.src("./typings.json").pipe(typings());
});

gulp.task('ts', ['typings'], function () {
    return tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(ts(tsProject))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('.tmp/scripts'));
});

gulp.task("webpack", ['ts'], function(callback) {
    // run webpack
    webpack(module.exports = {
        entry: "./.tmp/scripts/main.js",
        output: {
            filename: "bundle.js",
            path: __dirname + "/dist"
        },

        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",

        module: {
            preLoaders: [
                { test: /\.js$/, loader: "source-map-loader" }
            ]
        },

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            "react": "React",
            "react-dom": "ReactDOM"
        },
    }, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        gutil.log("[webpack]", stats.toString({
            // output options
        }));
        callback();
    });
});


gulp.task('default', ['bower', 'webpack']);

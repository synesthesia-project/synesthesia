var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require("gulp-util");
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var runSequence = require('run-sequence');
var webpack = require('webpack');

var tsProject = ts.createProject('src/tsconfig.json');

// Utility Functions

function handleError(err) {
  gutil.log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['build', '.tmp'], {read: false})
        .pipe(clean());
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(tsProject())
      .pipe(gulp.dest('.tmp/'));
});

gulp.task('tslint', function() {
  return gulp.src(['src/**/*.ts'])
  .pipe(tslint({
    formatter: 'verbose',
    configuration: '../tslint.json'
  }))
  .on('error', handleError)
  .pipe(tslint.report());
});

gulp.task("webpack", ['ts'], function(callback) {
    // run webpack
    webpack({
        entry: {
          bundle: "./.tmp/frontend/main.js",
        },
        output: {
            filename: "[name].js",
            path: __dirname + "/build/frontend"
        },

        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",

        module: {
            preLoaders: [
                { test: /\.js$/, loader: "source-map" }
            ]
        },

        // // When importing a module whose path matches one of the following, just
        // // assume a corresponding global variable exists and use that instead.
        // // This is important because it allows us to avoid bundling all of our
        // // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            "react": "React",
            "react-dom": "ReactDOM"
        },
    }, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        callback();
    });
});

gulp.task('copy-static', function () {
    return gulp.src(['src/frontend/static/index.html', 'src/frontend/static/index.css']).pipe(gulp.dest('build/frontend'));
});

gulp.task('copy-libs', function () {
    return gulp.src([
      'node_modules/react/dist/react.js',
      'node_modules/react-dom/dist/react-dom.js'
    ]).pipe(gulp.dest('build/frontend/lib'));
});

gulp.task('default', function(callback) {
  runSequence(
    'clean',
    ['webpack', 'copy-static', 'copy-libs'],
    'tslint',
    callback);
});

var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require("gulp-util");
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var runSequence = require('run-sequence');
var webpack = require('webpack');

var frontendTsProject = ts.createProject('src/frontend/tsconfig.json');
var backendTsProject = ts.createProject('src/backend/tsconfig.json');
var sharedTsProject = ts.createProject('src/shared/tsconfig.json');

// Utility Functions

function handleError(err) {
  gutil.log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['build', '.tmp'], {read: false})
        .pipe(clean());
});

gulp.task('frontend-ts', function () {
    return frontendTsProject.src()
      .pipe(frontendTsProject())
      .pipe(gulp.dest('.tmp/frontend/'));
});

gulp.task('backend-ts', function () {
    return backendTsProject.src()
      .pipe(backendTsProject())
      .pipe(gulp.dest('.tmp/backend/'));
});

gulp.task('shared-ts', function () {
    return sharedTsProject.src()
      .pipe(sharedTsProject())
      .pipe(gulp.dest('.tmp/shared/'));
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

gulp.task("frontend-webpack", ['frontend-ts'], function(callback) {
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
    }, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        callback();
    });
});

gulp.task('backend-copy', ['backend-ts'], function () {
    return gulp.src(['.tmp/backend/**/*']).pipe(gulp.dest('build/backend'));
});

gulp.task('shared-copy', ['shared-ts'], function () {
    return gulp.src(['.tmp/shared/**/*']).pipe(gulp.dest('build/shared'));
});

gulp.task('default', function(callback) {
  runSequence(
    'clean',
    ['frontend-webpack', 'backend-copy', 'shared-copy'],
    'tslint',
    callback);
});

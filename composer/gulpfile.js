var gulp = require('gulp');
var all = require('gulp-all');
var clean = require('gulp-clean');
var gutil = require("gulp-util");
var bower = require('gulp-bower');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var runSequence = require('run-sequence');
var webpack = require('webpack');

var tsProject = ts.createProject('src/scripts/ts/tsconfig.json');
var integrationTsProject = ts.createProject('src/integration/tsconfig.json');

// Utility Functions

function handleError(err) {
  gutil.log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['.tmp', 'dist'], {read: false})
        .pipe(clean());
});

gulp.task('bower', function() {
  return bower();
});

gulp.task("copy-js", function(){
  return gulp.src("./src/scripts/js/*.js")
    .pipe(gulp.dest('.tmp/scripts'))
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .on('error', handleError)
      .pipe(sourcemaps.write({
        sourceRoot: '/src/scripts/ts'
      }))
      .pipe(gulp.dest('.tmp/scripts'));
});

gulp.task('integration-ts', function () {
  return integrationTsProject.src()
    .pipe(sourcemaps.init())
    .pipe(integrationTsProject())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/integration'));
});

gulp.task('tslint', function() {
  return gulp.src(['src/**/*.ts', 'src/**/*.tsx'])
  .pipe(tslint({
    formatter: 'verbose',
    configuration: '../core/tslint.json'
  }))
  .on('error', handleError)
  .pipe(tslint.report());
});

gulp.task("webpack", ['bower', 'ts', 'copy-js'], function(callback) {
    // run webpack
    webpack({
        entry: {
          bundle: "./.tmp/scripts/main.js",
          auth_callback: "./.tmp/scripts/auth_callback.js",
        },
        output: {
            filename: "[name].js",
            path: __dirname + "/dist"
        },
    }, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        callback();
    });
});

gulp.task('css', function () {
  return gulp.src('./src/styles/**/*.css').pipe(gulp.dest('dist/styles'));
});

gulp.task("dist", ['webpack', 'css', 'integration-ts'], function(){
  var copyCoreFiles = gulp.src([
      './src/manifest.json',
      './src/index.html',
      './src/auth.html'
    ])
    .pipe(gulp.dest('dist'));

  var copyLibs = gulp.src([
      './bower_components/jquery/dist/jquery.min.js'
    ])
    .pipe(gulp.dest('dist/lib'));

  return all(copyCoreFiles, copyLibs);
});


gulp.task('default', function(callback) {
  runSequence(
    'clean',
    'dist',
    'tslint',
    callback);
});

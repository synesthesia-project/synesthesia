var gulp = require('gulp');
var clean = require('gulp-clean');
var PluginError = require("plugin-error");
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var webpack = require('webpack');

var tsProject = ts.createProject('src/scripts/ts/tsconfig.json');
var integrationTsProject = ts.createProject('src/integration/tsconfig.json');

// Utility Functions

function handleError(err) {
  throw new PluginError("Build failed", err.message);
}

gulp.task('clean', function() {
  return gulp.src(['.tmp', 'dist'], { read: false, allowEmpty: true})
        .pipe(clean());
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
    configuration: '../tslint.json'
  }))
  .on('error', handleError)
  .pipe(tslint.report());
});

gulp.task("webpack", function(callback) {
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
    mode: 'development',
    devtool: 'source-map-inline',
  }, function(err, stats) {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        throw new PluginError("webpack", err);
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        for (var err of info.errors)
          console.error(err);
        throw new PluginError("webpack", "has errors");
      }

      if (stats.hasWarnings()) {
        for (var err of info.errors)
          console.error(err);
      }
      callback();
  });
});

gulp.task('css', function () {
  return gulp.src('./src/styles/**/*.css').pipe(gulp.dest('dist/styles'));
});

gulp.task("dist", gulp.series(
  gulp.parallel(
    gulp.series(gulp.parallel('ts', 'copy-js'), 'webpack'),
    'css',
    'integration-ts'),
  function(){
    return gulp.src([
        './src/index.html',
        './src/auth.html'
      ])
      .pipe(gulp.dest('dist'));
  }
));


gulp.task('default', gulp.series('clean', 'dist'));

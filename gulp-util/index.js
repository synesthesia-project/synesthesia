var log         = require('fancy-log');
var gulp        = require('gulp');
var clean       = require('gulp-clean');
var gulpTslint  = require('gulp-tslint');
var ts          = require('gulp-typescript');
var path        = require('path');
var tslint      = require('tslint');
var PluginError = require('plugin-error');
var webpack     = require('webpack');

var package    = require('./package.json');
const PACKAGE_NAME = package.name;

exports.setupBasicTypescriptProject = function (opts) {

  // Validate Options
  if (typeof opts.tsconfig !== 'string')
    throw new Error('Invalid option: tsconfig');
  if (!(opts.clean instanceof Array))
    throw new Error('Invalid option: clean');
  if (typeof opts.outputDir !== 'string')
    throw new Error('Invalid option: outputDir');

  var tslintSrc = ['src/**/*.ts', 'src/**/*.tsx'];

  var tsProject = ts.createProject(opts.tsconfig);

  // Utility Functions

  function handleError(err) {
    log(PACKAGE_NAME, err.message);
    process.exit(1);
  }

  gulp.task('clean', function () {
    return gulp.src(opts.clean, { read: false, allowEmpty: true })
      .pipe(clean());
  });

  gulp.task('ts', function () {
    return tsProject.src()
      .pipe(tsProject())
      .on('error', handleError)
      .pipe(gulp.dest(opts.outputDir));
  });

  gulp.task('tslint', function () {
    var program = tslint.Linter.createProgram(opts.tsconfig);

    return gulp.src(tslintSrc)
      .pipe(gulpTslint({
        formatter: 'verbose',
        configuration: path.join(path.dirname(__dirname), 'tslint.json'),
        program
      }))
      .on('error', handleError)
      .pipe(gulpTslint.report());
  });
}

exports.webpackTask = function(name, options) {
  gulp.task(name, function (callback) {
    webpack(options, function (err, stats) {
      if (err) {
        log(PACKAGE_NAME, err.stack || err);
        if (err.details) {
          log(PACKAGE_NAME, err.details);
        }
        throw new PluginError("webpack", err);
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        for (var err of info.errors)
          log(PACKAGE_NAME, err);
        throw new PluginError("webpack", "has errors");
      }

      if (stats.hasWarnings()) {
        for (var err of info.errors)
          log(PACKAGE_NAME, err);
      }
      callback();
    });
  });
}
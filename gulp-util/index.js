var log         = require('fancy-log');
var gulp        = require('gulp');
var clean       = require('gulp-clean');
var sourcemaps  = require('gulp-sourcemaps');
var gulpTslint  = require('gulp-tslint');
var ts          = require('gulp-typescript');
var path        = require('path');
var tslint      = require('tslint');
var PluginError = require('plugin-error');
var webpack     = require('webpack');

var package     = require('./package.json');
const PACKAGE_NAME = package.name;

exports.typescriptTasks = function (opts) {

  if (opts.tsconfig && typeof opts.tsconfig !== 'string')
    throw new Error('Invalid option: tsconfig');
  if (typeof opts.outputDir !== 'string')
    throw new Error('Invalid option: outputDir');
  if (!(opts.tslintSrc instanceof Array))
    throw new Error('Invalid option: tslintSrc');

  var prefix = opts.prefix || '';
  var sourcemap = opts.sourcemap || false;
  var sourceRoot = opts.sourcemapSourceRoot || 'src';

  var tsProject = ts.createProject(opts.tsconfig);

  function handleError(err) {
    log(PACKAGE_NAME, err.message);
    process.exit(1);
  }

  gulp.task(prefix + 'ts', function () {
    var task = tsProject.src();
    if (sourcemap) {
      task = task.pipe(sourcemaps.init());
    }
    task = task
      .pipe(tsProject())
      .on('error', handleError);
    if (sourcemap) {
      task = task.pipe(
        sourcemap === 'external' ?
        sourcemaps.write('./', { sourceRoot }) :
        sourcemaps.write({ sourceRoot })
      );
    }
    task = task.pipe(gulp.dest(opts.outputDir));
    return task;
  });

  gulp.task(prefix + 'tslint', function () {
    var program = tslint.Linter.createProgram(opts.tsconfig);

    return gulp.src(opts.tslintSrc)
      .pipe(gulpTslint({
        formatter: 'verbose',
        configuration: path.join(path.dirname(__dirname), 'tslint.json'),
        program
      }))
      .on('error', handleError)
      .pipe(gulpTslint.report());
  });
}

exports.cleanTask = function (paths) {
  gulp.task('clean', function () {
    return gulp.src(paths, { read: false, allowEmpty: true })
      .pipe(clean());
  });
}

exports.setupBasicTypescriptProject = function (opts) {

  // Validate Options
  if (opts.tsconfig && typeof opts.tsconfig !== 'string')
    throw new Error('Invalid option: tsconfig');
  if (!(opts.clean instanceof Array))
    throw new Error('Invalid option: clean');
  if (typeof opts.outputDir !== 'string')
    throw new Error('Invalid option: outputDir');

  var tsconfig = opts.tsconfig || 'src/tsconfig.json';
  var tslintSrc = ['src/**/*.ts', 'src/**/*.tsx'];
  var sourcemap = opts.sourcemap || false;

  exports.cleanTask(opts.clean);

  exports.typescriptTasks({
    tsconfig,
    outputDir: opts.outputDir,
    sourcemap,
    tslintSrc
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
var log        = require('fancy-log');
var gulp       = require('gulp');
var clean      = require('gulp-clean');
var gulpTslint = require('gulp-tslint');
var ts         = require('gulp-typescript');
var path       = require('path');
var tslint     = require('tslint');

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
      .pipe(gulp.dest('./'));
  });

  gulp.task('tslint', function () {
    var program = tslint.Linter.createProgram(opts.tsconfig);

    return gulp.src(['src/**/*.ts'])
      .pipe(gulpTslint({
        formatter: 'verbose',
        configuration: path.join(path.dirname(__dirname), 'tslint.json'),
        program
      }))
      .on('error', handleError)
      .pipe(gulpTslint.report());
  });
}
var gulp = require('gulp');
var clean = require('gulp-clean');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var runSequence = require('run-sequence');

var tsProject = ts.createProject('src/ts/tsconfig.json');
var demoTsProject = ts.createProject('src/demo/ts/tsconfig.json');
var frontendTsProject = ts.createProject('src/frontend/ts/tsconfig.json');

// Utility Functions

function handleError(err) {
  gutil.log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['build'], {read: false})
        .pipe(clean());
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('build/ts/'));
});

gulp.task('demo-ts', function () {
    return demoTsProject.src()
      .pipe(sourcemaps.init())
      .pipe(demoTsProject())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('build/demo/'));
});

gulp.task('frontend-ts', function () {
    return frontendTsProject.src()
      .pipe(sourcemaps.init())
      .pipe(frontendTsProject())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('build/frontend/'));
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

gulp.task('demo', function () {
    return gulp.src(['src/demo/*.html', 'src/demo/*.css']).pipe(gulp.dest('build/demo/'));
});

gulp.task('demo-lib', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.*']).pipe(gulp.dest('build/demo/lib/'));
});

gulp.task('frontend', function () {
    return gulp.src(['src/frontend/*.html', 'src/frontend/*.css']).pipe(gulp.dest('build/frontend/'));
});

gulp.task('frontend-lib', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.*']).pipe(gulp.dest('build/frontend/lib/'));
});

gulp.task('default', function(callback) {
  runSequence(
    'clean',
    'ts',
    ['demo-ts', 'demo', 'demo-lib'],
    ['frontend-ts', 'frontend', 'frontend-lib'],
    callback);
});

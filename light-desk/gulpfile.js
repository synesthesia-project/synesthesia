var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');
var clean = require('gulp-clean');
var typedoc = require("gulp-typedoc");
var webpack = require('webpack');

util.cleanTask(['build', '.tmp']);

util.typescriptTasks({
  prefix: 'frontend-',
  tsconfig: 'src/frontend/tsconfig.json',
  outputDir: '.tmp/',
  lintSrc: ['src/frontend/**/*.ts', 'src/frontend/**/*.tsx'],
  sourcemap: true,
});

util.typescriptTasks({
  prefix: 'backend-',
  tsconfig: 'src/backend/tsconfig.json',
  outputDir: '.tmp/',
  lintSrc: ['src/backend/**/*.ts'],
  sourcemap: true,
});

util.typescriptTasks({
  prefix: 'shared-',
  tsconfig: 'src/shared/tsconfig.json',
  outputDir: '.tmp/shared/',
  lintSrc: ['src/shared/**/*.ts'],
  sourcemap: true,
});

util.webpackTask('frontend-webpack', {
  entry: {
    bundle: "./.tmp/frontend/main.js",
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/build/frontend"
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /perf_hooks/ })
  ]
});

gulp.task('backend-copy', function () {
    return gulp.src(['.tmp/backend/**/*']).pipe(gulp.dest('build/backend'));
});

gulp.task('shared-copy', function () {
    return gulp.src(['.tmp/shared/**/*']).pipe(gulp.dest('build/shared'));
});

gulp.task('frontend-audio-copy', function () {
    return gulp.src(['src/frontend/audio/**/*']).pipe(gulp.dest('build/frontend/audio'));
});

gulp.task('default', gulp.series(
  'clean',
  gulp.parallel(
    'frontend-ts',
    'backend-ts',
    'shared-ts'
  ),
  gulp.parallel(
    'frontend-webpack',
    'backend-copy',
    'shared-copy',
    'frontend-audio-copy'
  )
));

gulp.task('lint', gulp.series(
  gulp.parallel(
    'frontend-lint',
    'backend-lint',
    'shared-lint'
  )
));

gulp.task('lint:fix', gulp.series(
  gulp.parallel(
    'frontend-lint:fix',
    'backend-lint:fix',
    'shared-lint:fix'
  )
));

gulp.task('clean-docs', function () {
  return gulp.src(['docs/api'], { read: false, allowEmpty: true })
        .pipe(clean());
});

gulp.task('build-docs', function () {
  return gulp
    .src(['src/backend/**/*.ts'])
    .pipe(typedoc({
      readme: 'src/api-docs-readme.md',
      out: 'docs/api',
      name: 'API Reference - Synesthesia Project Light Desk',
      exclude: 'src/shared/**/*,src/backend/util/id-map.ts,src/backend/server.ts',
      // So that the generated output is consistent when the documentation hasn't changed, always use
      // 'master' as the branch, rather than the sha of the source that was used.
      gitRevision: 'develop',
      media: 'docs/media',
      tsconfig: 'src/backend/tsconfig.json'
    }));
});

gulp.task('docs', gulp.series('clean-docs', 'build-docs'));

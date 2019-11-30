var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');
var clean = require('gulp-clean');

gulp.task('clean', function() {
  return gulp.src(['.tmp', 'dist'], { read: false, allowEmpty: true })
        .pipe(clean());
});

gulp.task("copy-js", function(){
  return gulp.src("./src/scripts/js/*.js")
    .pipe(gulp.dest('.tmp/scripts'))
});

util.typescriptTasks({
  prefix: 'main-',
  tsconfig: 'src/scripts/ts/tsconfig.json',
  sourcemap: true,
  sourcemapSourceRoot: 'src/scripts/ts',
  outputDir: '.tmp/scripts',
  tslintSrc: ['src/scripts/ts/**/*.ts', 'src/scripts/ts/**/*.tsx']
});

util.typescriptTasks({
  prefix: 'integration-',
  tsconfig: 'src/integration/tsconfig.json',
  outputDir: 'dist/integration',
  tslintSrc: ['src/integration/**/*.ts']
});

gulp.task('tslint', gulp.parallel('main-tslint', 'integration-tslint'));

util.webpackTask('webpack', {
  entry: {
    bundle: "./.tmp/scripts/main.js",
    auth_callback: "./.tmp/scripts/auth_callback.js",
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist"
  },
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }
    ]
  }
});

gulp.task('css', function () {
  return gulp.src('./src/styles/**/*.css').pipe(gulp.dest('dist/styles'));
});

gulp.task("dist", gulp.series(
  gulp.parallel(
    gulp.series(gulp.parallel('main-ts', 'copy-js'), 'webpack'),
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

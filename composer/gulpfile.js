var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');
var webpack = require('webpack');

util.cleanTask(['.tmp', 'dist']);

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
  lintSrc: ['src/scripts/ts/**/*.ts', 'src/scripts/ts/**/*.tsx']
});

util.typescriptTasks({
  prefix: 'integration-',
  tsconfig: 'src/integration/tsconfig.json',
  outputDir: 'dist/integration',
  lintSrc: ['src/integration/**/*.ts']
});

gulp.task('lint', gulp.parallel('main-lint', 'integration-lint'));

gulp.task('lint:fix', gulp.parallel('main-lint:fix', 'integration-lint:fix'));

util.webpackTask('webpack', {
  entry: {
    bundle: "./.tmp/scripts/main.js",
    auth_callback: "./.tmp/scripts/auth_callback.js",
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist"
  },
  mode: 'development',
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

gulp.task('css', function () {
  return gulp.src('./src/styles/**/*.css').pipe(gulp.dest('dist/styles'));
});

gulp.task("dist", gulp.series(
  gulp.parallel(
    gulp.series(
      'integration-ts',
      gulp.parallel('main-ts', 'copy-js'), 'webpack'),
      'css',
    ),
  function(){
    return gulp.src([
        './src/index.html',
        './src/auth.html'
      ])
      .pipe(gulp.dest('dist'));
  }
));

gulp.task('default', gulp.series('clean', 'dist'));

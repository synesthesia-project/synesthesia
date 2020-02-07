var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');
var clean = require('gulp-clean');
var webpack = require('webpack');

util.setupBasicTypescriptProject({
  clean: ['lib/**/*', 'dist.min.*'],
  outputDir: './lib',
  sourcemap: 'external'
});

util.webpackTask('webpack', {
  entry: {
    dist: "./lib/entrypoint.js",
  },
  output: {
    filename: "[name].min.js",
    path: __dirname
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
  },
  plugins: [
    new webpack.BannerPlugin('@synesthesia-project/precise-audio | https://github.com/synesthesia-project/synesthesia/tree/master/precise-audio\nContent hash: [hash]')
  ],
});

gulp.task('clean-entrypoint', function () {
  return gulp.src(['lib/entrypoint.*'], { read: false, allowEmpty: true })
    .pipe(clean());
});

gulp.task('default', gulp.series('clean', 'ts', 'webpack', 'clean-entrypoint'));

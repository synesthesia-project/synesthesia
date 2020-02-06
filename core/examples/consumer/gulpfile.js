var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');
var webpack = require('webpack');

util.setupBasicTypescriptProject({
  clean: ['.tmp', 'build'],
  outputDir: '.tmp'
});

gulp.task("copy-static", function(){
  return gulp.src(['./src/*.html', './src/*.svg'])
    .pipe(gulp.dest('build/'))
});

util.webpackTask(
  'webpack',
  {
    entry: "./.tmp/main.js",
    output: {
      filename: "main.js",
      path: __dirname + "/build"
    },
    plugins: [
      new webpack.IgnorePlugin({ resourceRegExp: /perf_hooks/ })
    ]
  }
);

gulp.task('default', gulp.series(
  'clean',
  gulp.parallel(
    gulp.series('ts', 'webpack'),
    'copy-static'
  )
));
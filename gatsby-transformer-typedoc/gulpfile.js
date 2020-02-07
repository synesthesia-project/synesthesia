var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');

util.setupBasicTypescriptProject({
  clean: ['index.js', 'gatsby-node.js'],
  outputDir: '.'
});


gulp.task('default', gulp.series('clean', 'ts'));

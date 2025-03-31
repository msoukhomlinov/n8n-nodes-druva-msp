/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
const { src, dest, series, task, parallel, watch } = require('gulp');
const { deleteAsync } = require('del');

// Clean the dist directory
function clean() {
  return deleteAsync(['dist/**', '!dist']);
}

// Copy icon files to the dist/nodes directory
function copyIcons() {
  return src(['src/nodes/**/*.svg'])
    .pipe(dest('dist/nodes/'));
}

// Watch for changes in the source icon files
function watchIcons() {
  console.log('Watching for icon changes...');
  watch('src/nodes/**/*.svg', copyIcons);
}

// Define tasks
task('clean', clean);
task('copyIcons', copyIcons);
task('watchIcons', watchIcons);

// Post-compilation task: just copy icons (tsc handles structure)
task('build:post-compile', copyIcons);

// Watch task for development: requires tsc --watch to run first
task('dev:watch', watchIcons);

// Default task
exports.default = task('build:post-compile');

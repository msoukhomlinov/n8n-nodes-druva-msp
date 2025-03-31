/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
const { src, dest, series, task, parallel, watch } = require('gulp');
const { deleteAsync } = require('del');
const fs = require('node:fs');
const path = require('node:path');

// Clean the dist directory
function clean() {
  return deleteAsync(['dist/**', '!dist']);
}

// Copy icon files to the dist/nodes directory (after restructure)
function copyIcons() {
  return src(['src/nodes/**/*.svg'])
    .pipe(dest('dist/nodes/'));
}


// Move contents of dist/src/* to dist/* and delete dist/src
function restructureSrc() {
  return new Promise((resolve, reject) => {
    // Copy files from dist/src to dist
    src(['dist/src/**/*'], { base: 'dist/src' })
      .pipe(dest('dist/'))
      .on('end', () => {
        // Delete the now empty dist/src directory
        deleteAsync(['dist/src'], { force: true })
          .then(() => resolve())
          .catch(err => {
            console.warn('Warning: Could not delete dist/src directory:', err.message);
            resolve(); // Continue even if deletion fails
          });
      })
      .on('error', reject); // Handle potential errors during copy
  });
}

// Watch for changes in the source icon files
function watchIcons() {
  console.log('Watching for icon changes...');
  watch('src/nodes/**/*.svg', copyIcons);
}

// Watch for compiled files and restructure them when they change
function watchAndRestructure() {
  console.log('Watching for compiled TypeScript changes...');
  // Watch for any changes in the dist/src directory
  watch('dist/src/**/*', series(restructureSrc, copyIcons));
}

// Define tasks
task('clean', clean);
task('copyIcons', copyIcons); // Keep separate task for clarity
task('restructureSrc', restructureSrc);
task('watchIcons', watchIcons);
task('watchAndRestructure', watchAndRestructure);

// Post-compilation tasks: restructure first, then copy icons
task('build:post-compile', series(restructureSrc, copyIcons));

// Watch task for development: requires tsc --watch to run first
// Modified to include initial restructureSrc and continuous restructuring
task('dev:watch', series(
  copyIcons,
  parallel(watchIcons, watchAndRestructure)
));

// Default task
exports.default = task('build:post-compile');

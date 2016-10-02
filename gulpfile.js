const path = require('path');
const gulp = require('gulp');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const addSrc = require('gulp-add-src');
const browserify = require('gulp-browserify');
const babel = require('gulp-babel');
const staticFiles = require('./staticFiles');

gulp.task('compress', function () {
	return gulp.src([
		'js/**/*.js',
	])
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['es2015']
		}))
	//	.pipe(uglify())
		.pipe(addSrc(staticFiles))
		.pipe(concat('bundle.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('public'));
});

gulp.task('watch', function () {
	gulp.watch('js/**/*.js', ['compress']);
});

gulp.task('webserver', function () {
	require('./server');
});

gulp.task('default', function () {
	gulp.run(['compress', 'watch', 'webserver']);
});

// механизм импортирования зависимостей в node.js
const {src, dest, task, series, watch, parallel} = require('gulp');

const rm = require( 'gulp-rm' );
const sass = require('gulp-sass');
const pug = require('gulp-pug');
const concat = require('gulp-concat');
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const px2rem = require('gulp-smile-px2rem');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
 
// Компилятор для SASS
sass.compiler = require('node-sass');

// создаем сервер
browserSync = require('browser-sync').create();
const reload = browserSync.reload;

// результат работы функции src нужно передать дальше.
// Чтобы реализовать эту цепочку, нужно использовать pipe()
// функция dest() - записывает файлы в папку dist
//    Сначала очистим папку dist
task( 'clean', () => {
    return src( 'dist/**/*', { read: false }).pipe( rm() )
});

// Просто копируем файл с разметкой в папку dist
task("copy:html", () => {
    return src('./src/**/*.html')
      .pipe(dest('./dist'))
      .pipe(reload({stream: true}))
});

task("pug", () => {
  return src('./src/pages/**/*.pug', './src/blocks/**/*.pug')
      .pipe(pug({
        pretty: true
      }))
      .pipe(dest("./dist"))
      .pipe(reload({stream: true}))
});

task("copy:fonts", () => {
  return src('./src/fonts/**/*')
    .pipe(dest('./dist/fonts'))
    .pipe(reload({stream: true}))
});

task("copy:images", () => {
  //return src('./src/img/**/*')
  return src(['./src/img/**/*', '!src/img/**/*.svg'])
    .pipe(dest('./dist/img'))
    .pipe(reload({stream: true}))
});

//Создание спрайта с иконками
task("sprite", () => {
  return src("./src/img/icons/*.svg")
  .pipe(svgo({
      plugins: [
        {
          removeAttrs: { attrs: "(fill|stroke|style|width|height|data.*)"}
        }
      ]
    })
  )
  .pipe(svgSprite({
      mode: {
        symbol:{
          sprite: "../sprite.svg"
        }
      }
    })
  )
  .pipe(dest("./dist/img/icons"))
});


// Склеиваем файлы стилей в один
task("styles", () => {
  return src('src/styles/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(concat('main.scss'))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    //.pipe(px2rem())
    .pipe(autoprefixer(['last 15 versions', '>1%', 'ie 9'], {cascade: false}))
    .pipe(gcmq())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(dest('./dist'))
    .pipe(reload({stream: true}))
});


// Склеиваем файлы js в один
task("scripts", () => {
  return src('./src/scripts/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(concat("main.js", {newLine: ";"}))        // склеиваем в один файл и ставим ; перед содержимым каждого файла
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(dest('./dist'))
    .pipe(reload({stream: true}))
});

// php files
task("copy:php", () => {
  return src(('./src/phpmailer/*'))
    .pipe(dest('./dist/phpmailer'))
    .pipe(reload({stream: true}))
});
task("copy:mail-php", () => {
  return src(('./src/mail.php'))
    .pipe(dest('./dist'))
    .pipe(reload({stream: true}))
});

// После запуска данного таска browser-sync развернет нам сервер для разработки,
// для которого файлы будут взяты из папочки dist
task('server', () => {
  browserSync.init({
      server: {
          baseDir: "./dist",
      },
      // open: false
  });
});


// следим за изменениями файлов scss в проекте
// и если произошли какие-то изменения, будем вызывать таск styles
// watch("./src/*.html", series("copy:html"));
watch("./src/pages/**/*.pug", series("pug"));
watch("./src/blocks/**/*.pug", series("pug"));
watch("./src/styles/**/*.scss", series("styles"));
watch("./src/fonts/**/*", series("copy:fonts"));
watch("./src/img/**/*", series("copy:images"));
watch("./src/img/icons/*.svg", series("sprite"));
watch("./src/scripts/*.js", series("scripts"));
watch("./src/phpmailer/*", series("copy:php"));
watch("./src/mail.php", series("copy:mail-php"));

// дефолтный таск
task("default", series("clean", parallel("copy:html", "pug", "copy:fonts", "copy:images", "sprite", "styles", "scripts", "copy:php", "copy:mail-php"), "server"));

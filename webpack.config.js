const path = require("path");
const autoprefixer = require("autoprefixer");
const ExtractCSS = require("extract-text-webpack-plugin");

const MODE = process.env.WEBPACK_ENV;
const ENTRY_FILE = path.resolve(__dirname, "assets", "js", "main.js");
const OUTPUT_DIR = path.join(__dirname, "static");

const config = {
  entry: ENTRY_FILE,
  mode: MODE,
  module: {
    rules: [
      {
        test: /\.(scss)$/, //텍스트 파일을 추출하여 css 파일로 만들기
        use: ExtractCSS.extract([
          {
            loader: "css-loader"
          },
          {
            loader: "postcss-loader", //css를 받아서 plugin으로 css로 변환해줌
            options: {
              plugin() {
                return [autoprefixer({ browsers: "cover 99.5%" })];
              }
            }
          },
          {
            loader: "sass-loader" //아래에서 위로 실행되므로 마지막에 css-loader
          }
        ])
      }
    ]
  },
  output: {
    path: OUTPUT_DIR,
    filename: "[name].[format]"
  },
  plugins: [new ExtractCSS("styles.css")]
};

module.exports = config;

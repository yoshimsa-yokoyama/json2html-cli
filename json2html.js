#!/usr/bin/env node

'use strict';

const packageJson = require('./package.json');

const merge = require('deepmerge')
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const pug = require('pug');

const { Command } = require('commander');
const chalk = require('chalk');

const cb = err => {
  if (err) console.log(err);
};

// エラー文言
const ERROR_TEXT = {
  NO_JSON_FILE_ASSIGN: '指定されたファイルはエクセル（.json）ではありません。',
}

const jsonData = []
const optionData = {}

/**********************************************************
 *
 * コマンド開始
 *
 **********************************************************/
const init = () => {
  const program = new Command(packageJson.name)
    .version(packageJson.version)
    .option('-o, --outdir <outdir>', 'Html output javascript function')
    .option('-t, --tmpl <pugfile>', 'Template pug file')
    .option('-d, --data <json>', 'Single Json file or directory contains json files')
    .parse(process.argv);

  // コマンド名の表示
  console.log(`${chalk.white.bgBlue.bold(`HELLO ${program.name()}`)}`);

  // 指定ファイルの評価(拡張子で評価）
  if (
  program.args.length > 0 &&
    /^(\.\/)?[^\.]+\/?(.*\.json)?$/.test(program.args[0])
) {
    // オプションを解析
    const options = program.opts()
    // 現在のディレクトリまでの絶対パス
    const rootDir = path.resolve('./');
    // 渡された引数がルートパス表記かどうかの判定
    const isFromRootDir = /^\/.*$/.test(program.args[0]);
    // ファイルパスを取得
    let jsonFilePath = `${program.args[0]}`
    // ルートパスじゃなかったらrootDirを足す
    if (!isFromRootDir) {
      jsonFilePath = `${rootDir}/${program.args[0]}`
    }

    // ファイル情報を取得
    const jsonFileStat = fs.lstatSync(jsonFilePath, cb);

    // 元データのJSONファイルを処理
    if (jsonFileStat.isDirectory()) {
      // ディレクトリの場合JSONファイルを捜査
      const jsonsInDir = fs.readdirSync(jsonFilePath).filter(file => path.extname(file) === '.json')

      jsonsInDir.forEach(file => {
        const fileData = fs.readFileSync(path.join(jsonFilePath, file),cb)
        const json = JSON.parse(fileData.toString())

        jsonData.push(json)
      });
    } else {
      // 単体ファイルの場合そのままreadFileSync
      const fileData = fs.readFileSync(jsonFilePath,cb)
      const json = JSON.parse(fileData.toString())

      jsonData.push(json)
    }

    // オプションデータを読み込み＆成形
    if (options.data !== undefined) {
      // 渡された引数がルートパス表記かどうかの判定
      const isOptDataPathFromRootDir = /^\/.*$/.test(options.data)
      // ファイルパスを取得
      let dataJsonFilePath = `${options.data}`
      // ルートパスじゃなかったらrootDirを足す
      if (!isOptDataPathFromRootDir) {
        dataJsonFilePath = `${rootDir}/${options.data}`
      }

      // ファイル情報を取得
      const dataJsonFileStat = fs.lstatSync(dataJsonFilePath, cb)

      if (dataJsonFileStat.isDirectory()) {
        // ディレクトリの場合JSONファイルを捜査
        const dataJsonsInDir = fs.readdirSync(dataJsonFilePath).filter(file => path.extname(file) === '.json')

        dataJsonsInDir.forEach(file => {
          const dataKey = file.replace('.json','')
          const fileData = fs.readFileSync(path.join(dataJsonFilePath, file),cb)
          const json = JSON.parse(fileData.toString())

          if (dataKey !== 'data') {
            optionData[dataKey] = json
          } else {
            console.error('-d オプションで渡すデータのキーにdataは使用できません。データは無視されます。')
          }
        });
      } else {
        // 単体ファイルの場合そのままreadFileSync
        const dataKey = options.data.split('/')[options.data.split('/').length - 1].replace('.json','')
        const fileData = fs.readFileSync(dataJsonFilePath,cb)
        const json = JSON.parse(fileData.toString())

        optionData[dataKey] = json
      }
    }

    // pugのテンプレートを取得
    const pugTmpl = pug.compileFile(path.join('./',options.tmpl), {pretty: true})


    // ファイル保存用の関数
    // 渡された引数がルートパス表記かどうかの判定
    const isOutFunc = /^\/.js$/.test(options.outdir);
    let outDir = /^\/.*\/$/.test(options.outdir) ? `${rootDir}/${options.outdir}` : options.outdir;

    if (isOutFunc) {
      outDir = require(`${rootDir}/${options.outdir}`)
    }

    // HTML化するデータをpugのテンプレートと結合し、HTMLファイルを作成
    jsonData.forEach(obj => {
      const _tmp = obj
      const _html = pugTmpl(merge({data: _tmp}, optionData))

      // TODO: ここで出力パターンが関数の場合とディレクトリの場合で分ける
      if (isOutFunc) {
        outDir(_tmp,_html)
      } else {
        // ファイル書き出し
        fs.writeFileSync(outDir,_html,cb)
      }
    })

  } else {
    // JSONファイルが指定されなかった場合はエラー
    throw new Error(ERROR_TEXT.NO_JSON_FILE_ASSIGN);
  }
}

init();

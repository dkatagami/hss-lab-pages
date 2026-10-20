# 人間共生システム研究室 — GitHub Pages版

[元サイト](https://www.hss.cs.t-kougei.ac.jp/)を移行するための静的サイトです。日本語9ページ・英語9ページとCSS・JavaScript・画像を収録しています。

- [公開トップページ](https://dkatagami.github.io/hss-lab-pages/)
- [片上大輔](https://dkatagami.github.io/hss-lab-pages/katagami.html)
- [English](https://dkatagami.github.io/hss-lab-pages/en/)

## 公開と更新

GitHubの **Settings → Pages → Build and deployment** は、**Deploy from a branch / main / (root)** を使用します。`index.html` と画像・CSS・JavaScriptをリポジトリ直下に配置し、`.nojekyll` でJekyllによる変換を無効にしています。READMEではなく研究室サイトが公開URLのトップに表示されます。

HTML・CSS・JavaScript・画像を編集し、リンク検査後に `main` へpushすると、GitHub Pagesの標準処理で公開されます。独自のActionsワークフローはリンク検査のみを行います。

```powershell
python scripts/check_site.py
git add .
git commit -m "Update lab website"
git push
```

## ローカルで確認する

Python 3.9以上で、リポジトリ直下から実行します。

```powershell
python -m http.server 8000
```

ブラウザで <http://localhost:8000/> を開きます。

## 構成

```text
index.html             日本語トップ
katagami.html          片上大輔
*.html                 各日本語ページ
en/                    英語版
img/                   画像
*.css / *.js           スタイル・動作
.nojekyll              Jekyll変換の無効化
.github/workflows/     リンク検査
scripts/check_site.py  内部リンク検査
reports/               取得・検証記録
SOURCE.md              取得元と移行時の制約
```

リンクや画像は相対パスで指定します（例: `img/photo.jpg`、英語ページからは `../img/photo.jpg`）。ページのパスは元サイトと共通なので、将来ドメイン直下へ移行する場合にも同じファイル配置を使えます。

## 確認範囲と制約

18ページの内部参照1,076件について、欠落ファイル・欠落アンカーともに0件です。取得時のブラウザ検証では、画像、スマートフォンのメニュー、日英の業績検索、ニュース絞り込みを確認しています。

過去ニュースの3種類の参照先は元サイトでも404だったため、日英計6リンクを元URLのまま残しています。古いサイトマップにだけ掲載されていた追加29URLも取得時は404でした。未公開ファイル・サーバー側のPHPソースや管理機能は含みません。

詳細は [SOURCE.md](SOURCE.md)、[リンク検査結果](reports/link-audit.json)、[取得時のブラウザ検証結果](reports/browser-check.json) を参照してください。

# 人間共生システム研究室 — GitHub Pages版

[元サイト](https://www.hss.cs.t-kougei.ac.jp/)を、GitHub Pagesで配信できる静的サイトとして保存したリポジトリです。取得日: **2026年10月19日（UTC）**。

日本語9ページ・英語9ページと、CSS・JavaScript・画像43ファイルを収録しています。トップページは `site/index.html`、ご指定のページは `site/katagami.html` です。元のデザイン、文章、画像、メニュー、業績検索、ニュース絞り込み、日英切り替えを保持しています。ビルドやパッケージのインストールは不要です。

## GitHub Pagesで公開する

1. GitHubで空のリポジトリを作成します（例: `hss-lab-pages`）。無料プランで公開する場合はPublicを選びます。README等の自動生成は選びません。
2. このフォルダをローカルに置き、次を実行します。`YOUR_ACCOUNT` はご自身のGitHubアカウントに置き換えてください。

   ```bash
   cd hss-lab-pages
   # ZIPから展開した場合のみ、最初に実行
   git init -b main
   git add .
   git commit -m "Import lab website for GitHub Pages"

   git remote add origin https://github.com/YOUR_ACCOUNT/hss-lab-pages.git
   git push -u origin main
   ```

   すでにGit履歴があるフォルダでは `git init`・`git add`・`git commit` を省略できます。

3. GitHubの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選びます。
4. **Actions → Deploy static site to GitHub Pages → Run workflow** で `main` を指定して実行します。設定前に初回の自動実行が失敗していても、この手順で再実行できます。

公開URLの例:

```text
https://YOUR_ACCOUNT.github.io/hss-lab-pages/
https://YOUR_ACCOUNT.github.io/hss-lab-pages/katagami.html
https://YOUR_ACCOUNT.github.io/hss-lab-pages/en/
```

以後は `main` へのpushでリンク検査とデプロイが動きます。ドメイン直下に公開する `YOUR_ACCOUNT.github.io` という名前のリポジトリにも対応します。独自ドメインは設定していません。

## ローカルで確認する

Python 3.9以上を使用します。

```bash
python3 -m http.server 8000 --directory site
```

ブラウザで <http://localhost:8000/> を開きます。

リンク検査:

```bash
python3 scripts/check_site.py
python3 scripts/check_site.py --report reports/link-audit.json
```

内部のファイル参照、HTMLのページ内リンク、CSSの画像参照を調べます。ファイル欠落、公開先のサブパスで壊れるルート相対参照、フォームやbaseタグ、100MiB以上のファイルはエラーとして終了します。ページ内リンクの欠落と元ホストへの参照はレポートに記録します。外部サイトの稼働は検査しません。

## 構成と更新

```text
site/                   公開対象（HTML・CSS・JS・画像）
  index.html            日本語トップ
  katagami.html         片上大輔
  en/                   英語版
  img/                  画像
  .nojekyll             Jekyllによる変換を無効化
.github/workflows/      検査・Pagesデプロイ
scripts/check_site.py   標準ライブラリだけで実行できるリンク検査
reports/                移行範囲・検証結果・ファイルハッシュ
SOURCE.md               取得元と移行時の制約
```

更新するときは `site/` 内のファイルを直接編集し、検査後にpushしてください。リンクや画像のパスは相対パスにします（例: `img/photo.jpg`、英語ページからは `../img/photo.jpg`）。`reports/` やこのREADMEは公開用アーティファクトに入りません。

## 確認済み事項と制約

- 18ページを `/site/` というサブパスで配信して確認。内部参照1,076件、欠落ファイル・欠落アンカーともに0件。
- Chromiumで全18ページの画像読込とJavaScriptエラーを確認。スマートフォンのメニュー、日英の業績検索、ニュース絞り込みを確認。
- 過去ニュースの3種類の参照先は取得時に元サイトでも404でした。日英両方にある計6リンクは元URLのまま残しています。
- 元サイトの古いサイトマップにだけ掲載された追加29URLもすべて404でした。取得できない旧ページやPDFは収録していません。
- 調査対象は、公開ページからのリンクと元サイトのサイトマップで発見できる範囲です。未公開ファイル、リンクされていないファイル、サーバー側のPHPソースや管理機能は含みません。
- GitHub上でのリポジトリ作成・push・公開は未実施です。上記の手順で公開できます。

詳細は [SOURCE.md](SOURCE.md)、[リンク検査結果](reports/link-audit.json)、[ブラウザ検証結果](reports/browser-check.json) を参照してください。

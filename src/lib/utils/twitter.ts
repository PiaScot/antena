// スクリプトが読み込み中かどうかの状態を管理する
let isTwitterScriptLoading = false;
// スクリプトが読み込み終わった後に実行したい処理をためておくキュー
const twitterWidgetQueue: HTMLElement[] = [];

// スクリプトが読み込み完了したときに呼ばれる関数
function processTwitterQueue() {
	if (window.twttr) {
		twitterWidgetQueue.forEach((element) => {
			window.twttr.widgets.load(element);
		});
		// キューを空にする
		twitterWidgetQueue.length = 0;
	}
}

/**
 * Twitterのwidgets.jsをロードし、指定された要素内のツイートをカードに変換する
 * @param targetNode ツイートが含まれるDOM要素（例: shadowRoot）
 */
export function loadTwitterWidget(targetNode: HTMLElement) {
	// window.twttrがすでに存在すれば、すぐに変換処理を実行
	if (window.twttr) {
		window.twttr.widgets.load(targetNode);
		return;
	}

	// 変換したい要素をキューに追加
	twitterWidgetQueue.push(targetNode);

	// スクリプトがまだ読み込み中でなければ、読み込みを開始
	if (!isTwitterScriptLoading) {
		isTwitterScriptLoading = true;
		const script = document.createElement('script');
		script.id = 'twitter-widgets-script'; // 重複追加を防ぐためのID
		script.src = 'https://platform.twitter.com/widgets.js';
		script.async = true;
		script.charset = 'utf-8';

		// スクリプトの読み込みが完了したら、キューにある処理を実行
		script.onload = processTwitterQueue;

		document.head.appendChild(script);
	}
}

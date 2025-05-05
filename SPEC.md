# SVG Adjusterプログラム仕様書

## プログラム概要

### アーキテクチャ概念図

```
+------------------------------+
|    ユーザーインターフェース    |
|  (index.html + styles.css)   |
+------------------------------+
          |
          v
+------------------------------+
|    メインアプリケーション      |
|      (main.js)               |
+------------------------------+
     /              \
    v                v
+----------------+  +--------------------+
| SVG解析エンジン |  | レンダリングエンジン |
| (parser.js)    |  | (renderer.js)      |
+----------------+  +--------------------+
```

**データフロー概要**:
1. ユーザーがSVGコードを入力
2. Parser: SVGコードをJSONに変換
3. Renderer: JSONからプレビュー生成
4. ユーザーが操作を実行
5. Main: 状態を更新
6. Renderer: 更新された状態を表示

### 使用技術スタック

- **フロントエンド**: 
  - HTML5: ユーザーインターフェース構造
  - CSS3: スタイリングとレイアウト
  - JavaScript (ES6+): アプリケーションロジック
  
- **SVG処理**:
  - DOMParser API: SVGの解析
  - SVG DOM操作: プレビュー生成と操作
  
- **データ管理**:
  - JSON: SVG構造の中間表現
  - ブラウザストレージ API: ファイル保存

### 依存関係

- 外部ライブラリ依存なし
- ブラウザネイティブ APIs:
  - DOMParser
  - SVG DOM
  - Blob
  - URL
  - File API

## プログラム構造

### モジュール構成

SVG Adjusterは以下の4つの主要ファイルで構成されています:

1. **index.html**
   - ユーザーインターフェース構造の定義
   - 入力エリア、プレビュー、コントロールパネルの配置
   - 各種ボタンと操作要素の配置

2. **main.js**
   - アプリケーションのエントリポイント
   - 状態管理と各モジュール間の調整
   - イベントリスナーの設定
   - ユーザー操作ハンドリング

3. **parser.js**
   - SVGコードの解析と検証
   - SVG要素からJSONデータへの変換
   - 要素ID管理と検索機能

4. **renderer.js**
   - JSONデータからSVGプレビューの生成
   - 要素の操作機能（移動、重なり順序変更など）
   - グリッド表示管理
   - SVGコード生成と保存機能

5. **styles.css**
   - アプリケーションの視覚的スタイル定義
   - レスポンシブレイアウト
   - ユーザーインターフェースコンポーネントのスタイル

### クラス階層

SVG Adjusterは明示的なクラス定義は使用せず、モジュールパターンと関数ベースの設計を採用しています。主要なオブジェクト構造は以下のとおりです:

**state オブジェクト**: アプリケーションの状態を管理
```javascript
const state = {
  svgInput: '',        // SVG入力テキスト
  jsonData: [],        // JSON形式のSVGデータ
  jsonText: '',        // JSON文字列
  selectedElement: null, // 選択された要素
  parsedSVG: null,     // パース済みSVGのルート情報
  error: '',           // エラーメッセージ
  showGrid: true,      // グリッド表示フラグ
  gridSize: 50         // グリッドサイズ（px）
};
```

**elements オブジェクト**: DOM要素への参照を保持
```javascript
const elements = {
  svgInput: document.getElementById('svg-input'),
  parseButton: document.getElementById('parse-button'),
  // ... その他のDOM要素参照
};
```

**SVG要素のJSON表現**:
```javascript
{
  id: "element-id",    // 要素の一意識別子
  tag: "element-tag",  // SVG要素名（rect, circle等）
  attrs: {            // 要素の属性
    attr1: "value1",
    attr2: "value2",
    // ...
  },
  children: [         // 子要素配列（グループ要素の場合）
    // 子要素オブジェクト
  ],
  content: "text"     // テキスト要素の内容（text要素の場合のみ）
}
```

### データフロー

1. **入力フロー**:
   ```
   SVGコード入力 → parseSVG() → JSONデータ → 状態更新 → updatePreview()
   ```

2. **要素選択フロー**:
   ```
   プレビュークリック → handleElementClick() → 要素検索 → 状態更新 → UI更新
   ```

3. **要素操作フロー**:
   ```
   操作ボタンクリック → moveElement()/moveElementToFront() → JSONデータ更新 → updatePreview()
   ```

4. **JSON編集フロー**:
   ```
   JSONエディタ入力 → updateJson() → 状態更新 → updatePreview()
   ```

5. **保存フロー**:
   ```
   保存ボタンクリック → jsonToSVG() → Blob生成 → ファイル保存
   ```

## 関数一覧

### 主要関数の概要表

#### main.js

| 関数名 | 説明 | パラメータ | 戻り値 |
|--------|------|------------|--------|
| `jsonToSvgCode()` | JSONデータをSVGコードに変換して入力エリアに反映 | なし | なし |
| `saveSVG()` | 現在のSVGをファイルとして保存 | なし | なし |
| `updateJson(newJsonText)` | JSONテキスト更新時の処理 | newJsonText: JSON文字列 | なし |

#### parser.js

| 関数名 | 説明 | パラメータ | 戻り値 |
|--------|------|------------|--------|
| `parseSVG(svgString)` | SVGコードを解析してJSONに変換 | svgString: SVGコード | JSON配列 |
| `processElements(node, parentArray)` | SVG要素をJSON形式に変換 | node: DOM要素, parentArray: 配列 | JSON配列 |
| `findElementById(elements, id)` | 要素IDからJSON要素を検索 | elements: JSON配列, id: 要素ID | 要素オブジェクト |

#### renderer.js

| 関数名 | 説明 | パラメータ | 戻り値 |
|--------|------|------------|--------|
| `jsonToSVG(json)` | JSONデータからSVGコードを生成 | json: SVG構造JSON | SVGコード文字列 |
| `updatePreview()` | プレビュー表示を更新 | なし | なし |
| `moveElement(element, dx, dy)` | 要素を指定距離移動 | element: 要素, dx,dy: 移動距離 | なし |
| `moveElementToFront(element)` | 要素を最前面に移動 | element: 要素 | なし |
| `moveElementToBack(element)` | 要素を最背面に移動 | element: 要素 | なし |

### 公開API/インターフェース

SVG Adjusterはブラウザ内で動作するアプリケーションで、明示的な公開APIは提供していませんが、`window`オブジェクトを通じて以下の関数をグローバルに公開しています:

#### パーサー関連

```javascript
window.parseSVG = parseSVG;
window.findElementById = findElementById;
window.highlightElementInJsonEditor = highlightElementInJsonEditor;
```

#### レンダラー関連

```javascript
window.jsonToSVG = jsonToSVG;
window.updatePreview = updatePreview;
window.updateGrid = updateGrid;
window.moveElement = moveElement;
window.moveElementToFront = moveElementToFront;
window.moveElementToBack = moveElementToBack;
window.moveGroupToFront = moveGroupToFront;
window.moveGroupToBack = moveGroupToBack;
window.getSelectedMoveMode = getSelectedMoveMode;
window.findParentGroup = findParentGroup;
window.findParentArray = findParentArray;
```

#### 状態・UI要素関連

```javascript
window.state = state;
window.elements = elements;
```

## 関数詳細

### 各関数の詳細仕様

#### `parseSVG(svgString)`

**目的**: SVGコードを解析し、JSON形式に変換する

**パラメータ**:
- `svgString` (String): 解析対象のSVGコード

**戻り値**:
- (Array): SVG要素をJSON形式で表現した配列

**処理フロー**:
1. DOMParserを使用してSVGコードをDOM要素に変換
2. パースエラーをチェック
3. SVG要素を取得し、すべての要素にIDを確保
4. viewBoxなどの基本属性を取得
5. defs要素を処理
6. 全要素をJSON形式に変換
7. 状態を更新しUIを更新

**例外処理**:
- SVGパースエラー時は`state.error`に詳細を格納し、エラー表示

#### `jsonToSVG(json)`

**目的**: JSON形式のSVGデータからSVGコードを生成する

**パラメータ**:
- `json` (Array): SVG要素をJSON形式で表現した配列

**戻り値**:
- (String): 生成されたSVGコード

**処理フロー**:
1. SVGルート要素タグを生成
2. defs要素があれば処理
3. 各JSON要素をSVG要素に変換
4. 要素を結合してSVG文字列を生成

**例外処理**:
- 変換エラー時は`state.error`に詳細を格納し、エラー表示

#### `moveElement(element, dx, dy)`

**目的**: 指定された要素を相対距離だけ移動する

**パラメータ**:
- `element` (Object): 移動する要素オブジェクト
- `dx` (Number): X方向の移動距離
- `dy` (Number): Y方向の移動距離

**戻り値**: なし

**処理フロー**:
1. 移動モード（単一/グループ）を確認
2. 対象要素を特定（単一要素またはグループ）
3. 要素タイプに応じた座標属性を更新
   - rect/image: x, y属性
   - circle/ellipse: cx, cy属性
   - line: x1, y1, x2, y2属性
   - text: x, y属性
   - path/g: transform属性
4. JSON状態を更新しプレビューを更新

**要素タイプ別処理**:
```javascript
// 例: rect要素の移動
if (targetElement.attrs.x !== undefined) {
  targetElement.attrs.x = (parseFloat(targetElement.attrs.x) + dx).toString();
}
if (targetElement.attrs.y !== undefined) {
  targetElement.attrs.y = (parseFloat(targetElement.attrs.y) + dy).toString();
}
```

#### `moveElementToFront(element)`

**目的**: 指定された要素を最前面に移動する

**パラメータ**:
- `element` (Object): 対象要素オブジェクト

**戻り値**: なし

**処理フロー**:
1. 要素が属する親配列を検索
2. 配列から要素を削除
3. 配列の末尾に要素を追加（SVGのレンダリング順序で最前面になる）
4. JSON状態を更新しプレビューを更新

**実装例**:
```javascript
const index = parentArray.findIndex(el => el.id === element.id);
if (index !== -1) {
  const removed = parentArray.splice(index, 1)[0];
  parentArray.push(removed);
}
```

### パラメータ説明

#### SVG要素オブジェクト

```javascript
{
  id: String,     // 要素の一意識別子
  tag: String,    // SVG要素のタグ名（rect, circle, path等）
  attrs: {        // 要素の属性
    // 要素タイプによって異なる属性
    x: String,    // rect, image, text等で使用
    y: String,    // rect, image, text等で使用
    cx: String,   // circle, ellipse等で使用
    cy: String,   // circle, ellipse等で使用
    r: String,    // circle等で使用
    width: String, // rect, image等で使用
    height: String, // rect, image等で使用
    fill: String, // 塗りつぶし色
    stroke: String, // 線の色
    transform: String, // 変形属性
    // その他各要素固有の属性
  },
  children: Array, // グループ要素の場合の子要素配列
  content: String  // text要素の場合のテキスト内容
}
```

#### 移動距離パラメータ

- `dx`: X軸方向の移動量（ピクセル単位）
- `dy`: Y軸方向の移動量（ピクセル単位）
  - 正の値: 右/下方向への移動
  - 負の値: 左/上方向への移動
  - デフォルト移動量: 5.5px

### 戻り値と例外処理

#### parseSVG関数の戻り値

成功時: SVG要素のJSON配列
```javascript
[
  {
    id: "rect-1",
    tag: "rect",
    attrs: {
      x: "10",
      y: "10",
      width: "80",
      height: "80",
      fill: "blue"
    }
  },
  {
    id: "circle-1",
    tag: "circle",
    attrs: {
      cx: "50",
      cy: "50",
      r: "25",
      fill: "red"
    }
  }
]
```

失敗時: 空配列 `[]` および `state.error` へのエラーメッセージ格納

#### jsonToSVG関数の戻り値

成功時: SVGコード文字列
```xml
<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="blue" id="rect-1"/>
  <circle cx="50" cy="50" r="25" fill="red" id="circle-1"/>
</svg>
```

失敗時: 空文字列 `''` および `state.error` へのエラーメッセージ格納

### 内部アルゴリズム説明

#### SVG解析アルゴリズム

1. **DOMParserによる変換**:
   ```javascript
   const parser = new DOMParser();
   const doc = parser.parseFromString(svgString, 'image/svg+xml');
   ```

2. **要素ID割り当てアルゴリズム**:
   ```javascript
   function ensureElementIDs(rootElement) {
     const elements = rootElement.querySelectorAll('*');
     const idCounts = {};
     
     elements.forEach((el) => {
       if (!el.id) {
         const tagName = el.tagName.toLowerCase();
         idCounts[tagName] = (idCounts[tagName] || 0) + 1;
         el.id = `${tagName}-${idCounts[tagName]}`;
       }
     });
   }
   ```

3. **要素の再帰的処理**:
   ```javascript
   function processElements(node, parentArray = null) {
     const targetArray = parentArray || [];
     
     Array.from(node.children).forEach((child, index) => {
       // 各子要素の処理
       if (supportedElements.includes(child.tagName)) {
         const element = { /* 要素オブジェクト生成 */ };
         
         // グループの場合は再帰的に処理
         if (child.tagName === 'g') {
           element.children = [];
           processElements(child, element.children);
         }
         
         targetArray.push(element);
       }
     });
     
     return targetArray;
   }
   ```

#### 要素移動アルゴリズム

1. **要素タイプ判別**:
   - 要素タグ名（rect, circle, path等）に基づいて移動方法を選択

2. **座標更新ロジック**:
   - 基本図形（rect, circle等）: 直接座標属性を更新
   - パスやグループ: transform属性を使用して移動

3. **グループ移動処理**:
   ```javascript
   // グループのtransform属性を解析して更新
   const transform = targetElement.attrs.transform || '';
   let translateX = 0;
   let translateY = 0;
   
   const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
   if (match) {
     translateX = parseFloat(match[1]) + dx;
     translateY = parseFloat(match[2]) + dy;
   } else {
     translateX = dx;
     translateY = dy;
   }
   
   targetElement.attrs.transform = `translate(${translateX},${translateY})`;
   ```

#### 要素検索アルゴリズム

1. **ID検索**:
   ```javascript
   function findElementById(elements, id) {
     if (!elements || !Array.isArray(elements)) return null;
     
     // 直接の子をチェック
     for (const element of elements) {
       if (element.id === id) {
         return element;
       }
       
       // グループの子を再帰的にチェック
       if (element.tag === 'g' && element.children) {
         const found = findElementById(element.children, id);
         if (found) return found;
       }
     }
     
     return null;
   }
   ```

2. **親グループ検索**:
   ```javascript
   function findParentGroup(element, jsonData, currentGroup = null) {
     // ルートレベルでチェック
     for (let i = 0; i < jsonData.length; i++) {
       // 要素が見つかった場合は現在のグループを返す
       if (jsonData[i].id === element.id) {
         return currentGroup;
       }
       
       // グループを再帰的にチェック
       if (jsonData[i].tag === 'g' && jsonData[i].children) {
         const foundGroup = findParentGroup(element, jsonData[i].children, jsonData[i]);
         if (foundGroup !== undefined) {
           return foundGroup;
         }
       }
     }
     
     return undefined;
   }
   ```

#### グリッド表示アルゴリズム

1. **SVG座標系でのグリッド生成**:
   ```javascript
   function addGridToSVG() {
     // viewBoxを解析
     const [minX, minY, width, height] = viewBox.split(' ').map(Number);
     
     // グリッド線を生成
     for (let x = Math.ceil(minX / gridSize) * gridSize; x <= minX + width; x += gridSize) {
       // 縦線を追加
       const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
       line.setAttribute('x1', x);
       line.setAttribute('y1', minY);
       line.setAttribute('x2', x);
       line.setAttribute('y2', minY + height);
       line.setAttribute('stroke', strokeColor);
       gridGroup.appendChild(line);
     }
     
     // 横線も同様に生成
     // ...
   }
   ```

2. **グリッドの最背面配置**:
   ```javascript
   // SVG要素の先頭にグリッドを挿入（最背面に配置）
   svgElement.insertBefore(gridGroup, svgElement.firstChild);
   ```

#### 重なり順序操作アルゴリズム

1. **要素を最前面に移動**:
   ```javascript
   function moveElementToFront(element) {
     const parentArray = findParentArray(element, state.jsonData);
     
     if (parentArray) {
       // 配列から要素を削除して末尾に追加
       const index = parentArray.findIndex(el => el.id === element.id);
       if (index !== -1) {
         const removed = parentArray.splice(index, 1)[0];
         parentArray.push(removed);
       }
     }
   }
   ```

2. **要素を最背面に移動**:
   ```javascript
   function moveElementToBack(element) {
     const parentArray = findParentArray(element, state.jsonData);
     
     if (parentArray) {
       // 配列から要素を削除して先頭に追加
       const index = parentArray.findIndex(el => el.id === element.id);
       if (index !== -1) {
         const removed = parentArray.splice(index, 1)[0];
         parentArray.unshift(removed);
       }
     }
   }
   ```

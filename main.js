// main.js - メインファイルとイベントリスナーの設定

// 他のモジュールのインポート（モジュール対応環境の場合）
// import { parseSVG } from './parser.js';
// import { updatePreview, jsonToSVG, updateGrid } from './renderer.js';

// モジュール非対応環境では window オブジェクトに追加する形で関数を共有
// 以下の関数はparser.jsとrenderer.jsから提供されると想定

// メインアプリケーションの状態
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
  
  // DOM要素の参照
  const elements = {
    svgInput: document.getElementById('svg-input'),
    parseButton: document.getElementById('parse-button'),
    errorDisplay: document.getElementById('error-display'),
    editorContainer: document.getElementById('editor-container'),
    svgPreview: document.getElementById('svg-preview'),
    svgContent: document.getElementById('svg-content'),
    jsonEditor: document.getElementById('json-editor'),
    selectedElementInfo: document.getElementById('selected-element-info'),
    selectedElementTitle: document.querySelector('#selected-element-info h3'),
    selectedElementJson: document.querySelector('#selected-element-info pre'),
    showGrid: document.getElementById('show-grid'),
    gridSize: document.getElementById('grid-size'),
    clearButton: document.getElementById('clear-button'),
    elementControls: document.getElementById('element-controls'),
    bringToFrontBtn: document.getElementById('bring-to-front'),
    sendToBackBtn: document.getElementById('send-to-back'),
    moveModeRadios: document.getElementsByName('move-mode'),
    moveUpBtn: document.getElementById('move-up'),
    moveDownBtn: document.getElementById('move-down'),
    moveLeftBtn: document.getElementById('move-left'),
    moveRightBtn: document.getElementById('move-right'),
    jsonToCodeButton: document.getElementById('json-to-code-button'),
    saveButton: document.getElementById('save-button'),
    exampleBasic: document.getElementById('example-basic'),
    examplePath: document.getElementById('example-path'),
    findInJsonBtn: document.getElementById('find-in-json-btn')
  };
  
  // JSONをSVGコードに変換して入力エリアに反映する関数
  function jsonToSvgCode() {
    try {
      if (!state.jsonData || !state.parsedSVG) {
        throw new Error('JSONデータがありません');
      }
      
      // JSONからSVGコードに変換
      const svgString = jsonToSVG(state.jsonData);
      
      // 入力エリアに反映
      elements.svgInput.value = svgString;
      state.svgInput = svgString;
      
      // フォーカスして選択
      elements.svgInput.focus();
      elements.svgInput.select();
      
      // 成功メッセージ
      console.log('JSONからSVGコードに変換しました');
    } catch (err) {
      // エラー表示
      state.error = `JSONからSVGコードへの変換エラー: ${err.message}`;
      elements.errorDisplay.textContent = state.error;
      elements.errorDisplay.style.display = 'block';
      console.error('JSON→SVGコード変換エラー:', err);
    }
  }
  
  // SVGを保存する関数
  function saveSVG() {
    // 一時的にグリッドを削除
    const svgElement = elements.svgContent.querySelector('svg');
    const gridGroup = svgElement && svgElement.querySelector('#editor-grid');
    if (gridGroup) {
      svgElement.removeChild(gridGroup);
    }
    
    // SVGを文字列に変換
    const svgString = jsonToSVG(state.jsonData);
    
    // グリッドを復元（編集画面用）
    if (gridGroup && svgElement) {
      svgElement.insertBefore(gridGroup, svgElement.firstChild);
    }
    
    // ファイルとして保存
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drawing.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  // JSON編集時の更新
  function updateJson(newJsonText) {
    try {
      state.jsonText = newJsonText;
      const parsed = JSON.parse(newJsonText);
      state.jsonData = parsed;
      
      // 選択された要素がある場合、新しいJSONデータ内でそれを探す
      if (state.selectedElement) {
        const selectedId = state.selectedElement.id;
        state.selectedElement = findElementById(parsed, selectedId);
        
        // 選択された要素表示を更新
        if (state.selectedElement) {
          elements.selectedElementTitle.textContent = `選択: ${state.selectedElement.tag} (ID: ${state.selectedElement.id})`;
          elements.selectedElementJson.textContent = JSON.stringify(state.selectedElement, null, 2);
          elements.selectedElementInfo.style.display = 'block';
        } else {
          // 要素がデータ内に存在しなくなった
          elements.selectedElementInfo.style.display = 'none';
        }
      }
      
      updatePreview();
    } catch (err) {
      state.error = `JSONパースエラー: ${err.message}`;
      elements.errorDisplay.textContent = state.error;
      elements.errorDisplay.style.display = 'block';
      console.error('JSONパースエラー:', err);
    }
  }
  
  // ドキュメント読み込み時にイベントリスナーを設定
  document.addEventListener('DOMContentLoaded', function() {
    // パースボタンクリック
    elements.parseButton.addEventListener('click', function() {
      state.svgInput = elements.svgInput.value;
      if (state.svgInput.trim()) {
        parseSVG(state.svgInput);
      }
    });
  
    // JSONエディター変更
    elements.jsonEditor.addEventListener('input', function(e) {
      updateJson(e.target.value);
    });
  
    // グリッド表示の切り替え
    elements.showGrid.addEventListener('change', function(e) {
      state.showGrid = e.target.checked;
      updateGrid();
    });
  
    // グリッドサイズの変更
    elements.gridSize.addEventListener('change', function(e) {
      state.gridSize = parseInt(e.target.value);
      updateGrid();
    });
  
    // クリアボタン
    elements.clearButton.addEventListener('click', function() {
      // テキストエリアをクリア
      elements.svgInput.value = '';
      state.svgInput = '';
      
      // パース結果もクリア
      state.error = '';
      elements.errorDisplay.style.display = 'none';
      elements.editorContainer.style.display = 'none';
      
      // テキストエリアにフォーカス
      elements.svgInput.focus();
    });
  
    // JSONからSVGコードへの変換
    elements.jsonToCodeButton.addEventListener('click', jsonToSvgCode);
    
    // SVG保存
    elements.saveButton.addEventListener('click', saveSVG);
  
    // 方向ボタン
    elements.moveUpBtn.addEventListener('click', function() {
      if (state.selectedElement) {
        moveElement(state.selectedElement, 0, -5.5);
      }
    });
  
    elements.moveDownBtn.addEventListener('click', function() {
      if (state.selectedElement) {
        moveElement(state.selectedElement, 0, 5.5);
      }
    });
  
    elements.moveLeftBtn.addEventListener('click', function() {
      if (state.selectedElement) {
        moveElement(state.selectedElement, -5.5, 0);
      }
    });
  
    elements.moveRightBtn.addEventListener('click', function() {
      if (state.selectedElement) {
        moveElement(state.selectedElement, 5.5, 0);
      }
    });
  
    // 前面/後面移動ボタン
    elements.bringToFrontBtn.addEventListener('click', function() {
      if (state.selectedElement) {
        // 選択されているモードを取得
        const moveMode = getSelectedMoveMode();
        
        if (moveMode === 'single') {
          // 単一要素のみ移動
          moveElementToFront(state.selectedElement);
        } else {
          // グループ全体を移動
          moveGroupToFront(state.selectedElement);
        }
      }
    });
  
    elements.sendToBackBtn.addEventListener('click', function() {
      if (state.selectedElement) {
        // 選択されているモードを取得
        const moveMode = getSelectedMoveMode();
        
        if (moveMode === 'single') {
          // 単一要素のみ移動
          moveElementToBack(state.selectedElement);
        } else {
          // グループ全体を移動
          moveGroupToBack(state.selectedElement);
        }
      }
    });
  
    // JSON内の要素を検索するボタン
    elements.findInJsonBtn.addEventListener('click', function() {
      if (state.selectedElement) {
        highlightElementInJsonEditor(state.selectedElement);
      }
    });
  
    // サンプル例ボタン
    elements.exampleBasic.addEventListener('click', function() {
      const example = '<svg viewBox="0 0 100 100"><defs><linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="oklch(85% 0.1 230)" /><stop offset="100%" stop-color="oklch(70% 0.15 330)" /></linearGradient></defs><rect x="10" y="10" width="80" height="80" fill="darkblue" id="rect1" /><circle cx="50" cy="50" r="25" fill="url(#blue-gradient)" id="circle1" /></svg>';
      elements.svgInput.value = example;
      state.svgInput = example;
      parseSVG(example);
    });
  
    elements.examplePath.addEventListener('click', function() {
      const example = '<svg viewBox="0 0 200 100"><g transform="translate(0,0)"><path d="M10,90 Q50,10 90,90" stroke="green" fill="none" stroke-width="5" id="path1" /><text x="9" y="45.5" font-size="15" id="text1">SVG Adjuster</text></g></svg>';
      elements.svgInput.value = example;
      state.svgInput = example;
      parseSVG(example);
    });
  
    // 初期コンテンツの設定
    if (elements.svgInput.value.trim()) {
      state.svgInput = elements.svgInput.value;
      parseSVG(state.svgInput);
    }
  
    // グリッドの初期化
    updateGrid();
  });
  
  // グローバルオブジェクトに参照を追加（モジュール非対応環境用）
  window.state = state;
  window.elements = elements;
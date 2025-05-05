// parser.js - SVG解析とデータ変換機能

// SVGをパースしてJSONに変換する関数
function parseSVG(svgString) {
    try {
      state.error = '';
      elements.errorDisplay.style.display = 'none';
      
      // DOMパーサーを作成
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // パースエラーをチェック
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('SVGパースエラー: ' + parserError.textContent);
      }
      
      // SVG要素を取得
      const svgElement = doc.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG要素が見つかりません');
      }
      
      // すべての要素にIDを確保
      ensureElementIDs(svgElement);
      
      // viewBoxとその他の基本属性を設定
      const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
      const width = svgElement.getAttribute('width') || '100%';
      const height = svgElement.getAttribute('height') || '100%';
      
      // 定義（defs）を抽出して処理
      const defs = [];
      const defsElement = svgElement.querySelector('defs');
      if (defsElement) {
        processDefs(defsElement, defs);
      }
      
      // パース済みSVGルートを設定
      state.parsedSVG = {
        tag: 'svg',
        attrs: {
          viewBox,
          width,
          height
        },
        defs: defs
      };
      
      // 要素をJSONに変換
      const jsonElements = [];
      
      // SVG子ノードを処理する
      processElements(svgElement, jsonElements);
      
      state.jsonData = jsonElements;
      state.jsonText = JSON.stringify(jsonElements, null, 2);
      elements.jsonEditor.value = state.jsonText;
      
      // UI更新
      elements.editorContainer.style.display = 'flex';
      updatePreview();
      
      return jsonElements;
    } catch (err) {
      state.error = `SVGパースエラー: ${err.message}`;
      elements.errorDisplay.textContent = state.error;
      elements.errorDisplay.style.display = 'block';
      console.error('SVGパースエラー:', err);
      return [];
    }
  }
  
  // SVG要素を処理して JSON に変換する関数
  function processElements(node, parentArray = null) {
    const supportedElements = ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text', 'g', 'marker'];
    const targetArray = parentArray || [];
    
    Array.from(node.children).forEach((child, index) => {
      // defsは別途処理するのでスキップ
      if (child.tagName === 'defs') return;
      
      if (supportedElements.includes(child.tagName)) {
        const element = {
          id: child.id || `${child.tagName}-${index}`,
          tag: child.tagName,
          attrs: {}
        };
        
        // すべての属性を取得
        Array.from(child.attributes).forEach(attr => {
          element.attrs[attr.name] = attr.value;
        });
        
        // グループを再帰的に処理
        if (child.tagName === 'g') {
          element.children = [];
          processElements(child, element.children);
        }
        
        // テキスト要素のための内部HTMLコンテンツを取得（tspanタグを含む）
        if (child.tagName === 'text') {
          element.content = child.innerHTML.replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
        }
        
        targetArray.push(element);
      } else if (child.tagName) {
        // サポートされていない要素を処理
        console.log(`サポートされていない要素をスキップ: ${child.tagName}`);
      }
    });
    
    return targetArray;
  }
  
  // すべての要素にIDを確保する関数
  function ensureElementIDs(rootElement) {
    const elements = rootElement.querySelectorAll('*');
    const idCounts = {};
    
    elements.forEach((el) => {
      if (!el.id) {
        const tagName = el.tagName.toLowerCase();
        // 各タグタイプのカウントを追跡して一意のIDを確保
        idCounts[tagName] = (idCounts[tagName] || 0) + 1;
        el.id = `${tagName}-${idCounts[tagName]}`;
      }
    });
  }
  
  // SVG定義（グラデーション、フィルター等）を処理する関数
  function processDefs(defsNode, defsArray) {
    const supportedDefs = ['linearGradient', 'radialGradient', 'filter', 'pattern', 'clipPath', 'mask', 'marker'];
    
    Array.from(defsNode.children).forEach((def, index) => {
      if (supportedDefs.includes(def.tagName)) {
        const defElement = {
          id: def.id || `${def.tagName}-${index}`,
          tag: def.tagName,
          attrs: {},
          children: []
        };
        
        // すべての属性を取得
        Array.from(def.attributes).forEach(attr => {
          defElement.attrs[attr.name] = attr.value;
        });
        
        // 定義要素の子を処理
        Array.from(def.children).forEach((child, childIndex) => {
          const childElement = {
            id: child.id || `${child.tagName}-${childIndex}`,
            tag: child.tagName,
            attrs: {}
          };
          
          // 子のすべての属性を取得
          Array.from(child.attributes).forEach(attr => {
            childElement.attrs[attr.name] = attr.value;
          });
          
          // ネストされたフィルター要素を処理
          if (child.children && child.children.length > 0) {
            childElement.children = [];
            Array.from(child.children).forEach((grandChild, gcIndex) => {
              const gcElement = {
                id: grandChild.id || `${grandChild.tagName}-${gcIndex}`,
                tag: grandChild.tagName,
                attrs: {}
              };
              
              Array.from(grandChild.attributes).forEach(attr => {
                gcElement.attrs[attr.name] = attr.value;
              });
              
              childElement.children.push(gcElement);
            });
          }
          
          defElement.children.push(childElement);
        });
        
        defsArray.push(defElement);
      }
    });
  }
  
  // JSONデータ内でIDで要素を見つける（再帰的）
  function findElementById(elements, id) {
    if (!elements || !Array.isArray(elements)) return null;
    
    // まず直接の子をチェック
    for (const element of elements) {
      if (element.id === id) {
        return element;
      }
      
      // グループの子をチェック
      if (element.tag === 'g' && element.children) {
        const found = findElementById(element.children, id);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  // JSONエディタ内で要素を検索して表示する関数
  function highlightElementInJsonEditor(element) {
    try {
      if (!element || !element.id) {
        console.log('有効な要素が選択されていません');
        return;
      }
      
      // JSON全体のテキスト
      const fullJsonText = elements.jsonEditor.value;
      
      // IDをベースに検索する方法
      const idPattern = new RegExp(`"id"\\s*:\\s*"${element.id}"`, 'g');
      const match = idPattern.exec(fullJsonText);
      
      if (match) {
        // マッチした位置
        const foundIndex = match.index;
        
        // マッチした位置の前後のブロックを見つける
        let startBlock = foundIndex;
        let openBraces = 0;
        let closeBraces = 0;
        
        // 開始ブラケットを見つける（前方検索）
        for (let i = foundIndex; i >= 0; i--) {
          if (fullJsonText[i] === '{') {
            if (openBraces === 0) {
              startBlock = i;
              break;
            }
            openBraces--;
          } else if (fullJsonText[i] === '}') {
            openBraces++;
          }
        }
        
        // 終了ブラケットを見つける（後方検索）
        let endBlock = foundIndex;
        for (let i = foundIndex; i < fullJsonText.length; i++) {
          if (fullJsonText[i] === '{') {
            closeBraces++;
          } else if (fullJsonText[i] === '}') {
            if (closeBraces === 0) {
              endBlock = i + 1; // 閉じ括弧を含める
              break;
            }
            closeBraces--;
          }
        }
        
        // 選択範囲
        const selectionStart = startBlock;
        const selectionEnd = endBlock;
        
        // エディタにフォーカスして選択
        elements.jsonEditor.focus();
        elements.jsonEditor.setSelectionRange(selectionStart, selectionEnd);
        
        // スクロール位置の調整
        const textBeforeSelection = fullJsonText.substring(0, selectionStart);
        const lineCount = (textBeforeSelection.match(/\n/g) || []).length;
        const lineHeight = getActualLineHeight(elements.jsonEditor); // 行の高さの推定値
  
        const scrollPosition = lineCount * lineHeight - 100; // 上部に余白
        elements.jsonEditor.scrollTop = Math.max(0, scrollPosition);
        
        // 視覚的なフィードバック
        const originalBackgroundColor = elements.jsonEditor.style.backgroundColor;
        elements.jsonEditor.style.backgroundColor = '#f0f8ff'; // 薄い青色のハイライト
        setTimeout(() => {
          elements.jsonEditor.style.backgroundColor = originalBackgroundColor;
        }, 1000);
        
        console.log(`要素 ID: ${element.id} をJSONエディタ内で見つけました`);
      } else {
        console.log(`要素 ID: ${element.id} をJSONエディタ内で見つけられませんでした`);
      }
    } catch (e) {
      console.error('JSONエディタ内での検索中にエラーが発生しました:', e);
    }
  }
  
  // 実際の行の高さを取得する関数
  function getActualLineHeight(textElement) {
    // テキストエリアの内容と現在の位置を保存
    const originalValue = textElement.value;
    const originalScrollTop = textElement.scrollTop;
    const originalSelectionStart = textElement.selectionStart;
    const originalSelectionEnd = textElement.selectionEnd;
    
    // 101行目を作成して測定する
    textElement.value = 'X' + '\nX'.repeat(100);
    const singleLineHeight = textElement.scrollHeight;
    
    // 111行目を作成して差分を測定
    textElement.value = 'X' + '\nX'.repeat(110);
    const doubleLineHeight = textElement.scrollHeight;
    
    // 行の高さ = 10行分の高さの差 / 10
    const lineHeight = (doubleLineHeight - singleLineHeight) / 10.0;
    
    // 元の状態に戻す
    textElement.value = originalValue;
    textElement.scrollTop = originalScrollTop;
    textElement.setSelectionRange(originalSelectionStart, originalSelectionEnd);
    return lineHeight > 0 ? lineHeight : 18; // 計算に失敗した場合はデフォルト値を返す
  }
  
  // グローバルオブジェクトに参照を追加（モジュール非対応環境用）
  window.parseSVG = parseSVG;
  window.findElementById = findElementById;
  window.highlightElementInJsonEditor = highlightElementInJsonEditor;
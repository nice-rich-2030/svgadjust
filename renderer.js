// renderer.js - 描画とSVG要素操作機能

// JSONをSVGに変換する関数
function jsonToSVG(json) {
    try {
      if (!state.parsedSVG) return '';
      
      // SVG要素を作成
      let svg = `<svg viewBox="${state.parsedSVG.attrs.viewBox}" width="${state.parsedSVG.attrs.width}" height="${state.parsedSVG.attrs.height}" xmlns="http://www.w3.org/2000/svg">\n`;
      
      // 定義がある場合は追加
      if (state.parsedSVG.defs && state.parsedSVG.defs.length > 0) {
        svg += '  <defs>\n';
        
        state.parsedSVG.defs.forEach(def => {
          svg += `    <${def.tag} id="${def.id}"`;
          
          // 属性を追加
          for (const [key, value] of Object.entries(def.attrs || {})) {
            if (key !== 'id') { // idは既に追加済みなのでスキップ
              svg += ` ${key}="${value}"`;
            }
          }
          
          svg += '>\n';
          
          // 子要素を処理
          if (def.children && def.children.length > 0) {
            def.children.forEach(child => {
              svg += `      <${child.tag}`;
              
              // 属性を追加
              for (const [key, value] of Object.entries(child.attrs || {})) {
                svg += ` ${key}="${value}"`;
              }
              
              // ネストされたフィルター要素または自己閉じタグを処理
              if (child.children && child.children.length > 0) {
                svg += '>\n';
                
                child.children.forEach(gc => {
                  svg += `        <${gc.tag}`;
                  
                  // 属性を追加
                  for (const [key, value] of Object.entries(gc.attrs || {})) {
                    svg += ` ${key}="${value}"`;
                  }
                  
                  svg += ' />\n';
                });
                
                svg += `      </${child.tag}>\n`;
              } else {
                // 自己閉じタグ
                svg += ' />\n';
              }
            });
          }
          
          svg += `    </${def.tag}>\n`;
        });
        
        svg += '  </defs>\n';
      }
      
      // 各要素を処理
      json.forEach(element => {
        svg += elementToSVG(element);
      });
      
      svg += '</svg>';
      return svg;
    } catch (err) {
      state.error = `JSONからSVGへの変換エラー: ${err.message}`;
      elements.errorDisplay.textContent = state.error;
      elements.errorDisplay.style.display = 'block';
      console.error('JSON→SVG変換エラー:', err);
      return '';
    }
  }
  
  // 単一要素をSVGに変換する関数
  function elementToSVG(element, indent = 0) {
    if (!element || !element.tag) return '';
    
    // インデント文字列を作成
    const indentStr = ' '.repeat(indent);
  
    let attrs = '';
    for (const [key, value] of Object.entries(element.attrs || {})) {
      // id属性は別途追加するのでスキップ
      if (key !== 'id') {
        attrs += ` ${key}="${value}"`;
      }
    }
    
    // 常にid属性を追加
    if (element.id) {
      attrs += ` id="${element.id}"`;
    }
    
    // 子を持つグループの特別な処理
    if ((element.tag === 'g' || element.tag === 'marker') && element.children) {
      let result = `${indentStr}<${element.tag}${attrs}>\n`;
      
      element.children.forEach(child => {
        result += elementToSVG(child, indent + 2); // 子のインデントを増加
      });
      
      result += `${indentStr}</${element.tag}>\n`;
      return result;
    }
    
    // 自己閉じ要素
    if (['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path'].includes(element.tag)) {
      return `${indentStr}<${element.tag}${attrs}/>\n`;
    }
    
    // コンテンツを持つ要素（textなど）
    return `${indentStr}<${element.tag}${attrs}>${element.content || ''}</${element.tag}>\n`;
  }
  
  // プレビューを更新してイベントリスナーを追加
  function updatePreview() {
    elements.svgContent.innerHTML = '';
    const svgCode = jsonToSVG(state.jsonData);
    elements.svgContent.innerHTML = svgCode;
    
    // SVG要素にイベントリスナーを追加
    const svgElement = elements.svgContent.querySelector('svg');
    if (svgElement) {
      console.log('SVGリスナー追加: SVG要素が見つかりました');
      
      // レンダリングされたSVGのIDがJSON構造と一致することを確認
      syncElementIDs(svgElement, state.jsonData);
      
      // クリックリスナーを追加
      addClickListeners(svgElement);
      updateGrid();
    } else {
      console.log('SVGリスナー追加: SVG要素が見つかりません');
    }
  }
  
  // JSON間とレンダリングされたSVG間で要素IDを同期
  function syncElementIDs(svgElement, jsonData) {
    // まずSVGの直接の子をすべて処理
    syncElementsRecursive(svgElement, jsonData);
    
    // 要素とその子を再帰的に処理する関数
    function syncElementsRecursive(parentElement, jsonElements) {
      // 処理するJSONがなければスキップ
      if (!jsonElements || !jsonElements.length) return;
      
      // すべての子要素を処理
      let elementIndex = 0;
      for (const jsonEl of jsonElements) {
        // 対応するDOM要素を検索（JSON順序と同じとは限らない）
        let domEl;
        
        // まずタグとIDで検索
        if (jsonEl.id) {
          domEl = parentElement.querySelector(`${jsonEl.tag}[id="${jsonEl.id}"]`);
        }
        
        // 見つからない場合、タグと位置で検索
        if (!domEl) {
          const elements = Array.from(parentElement.children).filter(el => 
            el.tagName.toLowerCase() === jsonEl.tag.toLowerCase()
          );
          
          if (elements.length > elementIndex) {
            domEl = elements[elementIndex];
          }
        }
        
        // 要素が見つかった場合、正しいIDを設定
        if (domEl) {
          domEl.id = jsonEl.id;
          
          // これがグループの場合、子を再帰的に処理
          if (jsonEl.tag === 'g' && jsonEl.children && jsonEl.children.length) {
            syncElementsRecursive(domEl, jsonEl.children);
          }
        }
        
        elementIndex++;
      }
    }
  }
  
  // SVG要素にクリックリスナーを追加
  function addClickListeners(svgElement) {
    // イベント委譲を使用
    svgElement.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // IDを持つクリックされた要素を見つける
      let target = e.target;
      
      // デバッグ：クリックされた要素を確認
      console.log('クリック要素:', target);
      
      // IDを持つ要素を見つけ、必要に応じて上位に移動
      while (target && !target.id && target !== svgElement) {
        target = target.parentElement;
      }
      
      // IDを持つ要素が見つかった場合
      if (target && target.id) {
        console.log('ID付き要素が見つかりました:', target.id);
        handleElementClick(target.id);
      } else {
        console.log('ID付き要素が見つかりません');
      }
    });
  }
  
  // 要素選択の処理
  function handleElementClick(id) {
    console.log('要素クリック処理 ID:', id);
    const element = findElementById(state.jsonData, id);
    state.selectedElement = element;
  
    if (element) {
      console.log('JSONデータ内で要素が見つかりました:', element);
      // 選択された要素情報を更新
      elements.selectedElementTitle.textContent = `選択: ${element.tag} (ID: ${element.id})`;
      elements.selectedElementJson.textContent = JSON.stringify(element, null, 2);
      elements.selectedElementInfo.style.display = 'block';
  
      // コントロールを表示
      elements.elementControls.style.display = 'block';
      
      // エディタ内の対応するJSONをハイライト
      highlightElementInJsonEditor(element);
    } else {
      console.log('JSONデータ内でID要素が見つかりません:', id);
      elements.selectedElementInfo.style.display = 'none';
    }
  }
  
  // SVG内にグリッドを追加する関数
  function addGridToSVG() {
    // グリッドが不要な場合は何もしない
    if (!state.showGrid) {
      removeGridFromSVG();
      return;
    }
    
    // 既存のグリッドがあれば削除
    removeGridFromSVG();
    
    // SVG要素を取得
    const svgElement = elements.svgContent.querySelector('svg');
    if (!svgElement) return;
    
    // viewBoxの値を解析
    const viewBox = svgElement.getAttribute('viewBox');
    if (!viewBox) return;
    
    const [minX, minY, width, height] = viewBox.split(' ').map(Number);
    
    // グリッドの論理サイズ（SVG座標系）
    const gridSize = parseInt(state.gridSize);
    
    // グリッドを格納するためのグループ要素を作成
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('id', 'editor-grid');
    gridGroup.setAttribute('style', 'pointer-events: none;');
    
    // グリッド線の色と透明度を設定（gridSizeに応じて調整可能）
    const strokeColor = 'rgba(200, 200, 200, 0.3)';
    const strokeWidth = 0.5;
    
    // 縦線を追加
    for (let x = Math.ceil(minX / gridSize) * gridSize; x <= minX + width; x += gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', minY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', minY + height);
      line.setAttribute('stroke', strokeColor);
      line.setAttribute('stroke-width', strokeWidth);
      gridGroup.appendChild(line);
    }
    
    // 横線を追加
    for (let y = Math.ceil(minY / gridSize) * gridSize; y <= minY + height; y += gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', minX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', minX + width);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', strokeColor);
      line.setAttribute('stroke-width', strokeWidth);
      gridGroup.appendChild(line);
    }
    
    // SVG要素の先頭にグリッドを挿入（最背面に配置）
    svgElement.insertBefore(gridGroup, svgElement.firstChild);
  }
  
  // SVGからグリッドを削除する関数
  function removeGridFromSVG() {
    const svgElement = elements.svgContent.querySelector('svg');
    if (!svgElement) return;
    
    const gridGroup = svgElement.querySelector('#editor-grid');
    if (gridGroup) {
      svgElement.removeChild(gridGroup);
    }
  }
  
  // グリッド更新関数
  function updateGrid() {
    if (state.showGrid) {
      addGridToSVG();
    } else {
      removeGridFromSVG();
    }
  }
  
  // 要素を移動する関数
  function moveElement(element, dx, dy) {
    if (!element) return;
    
    // 選択されているモードを取得
    const moveMode = getSelectedMoveMode();
    const targetElement = moveMode === 'single' ? element : findParentGroup(element, state.jsonData) || element;
    
    // 要素のタイプに応じた移動処理
    if (targetElement.tag === 'g') {
      // グループの場合はtransform属性を更新
      const transform = targetElement.attrs.transform || '';
      let translateX = 0;
      let translateY = 0;
      
      // 既存のtranslate値を解析
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (match) {
        translateX = parseFloat(match[1]) + dx;
        translateY = parseFloat(match[2]) + dy;
      } else {
        translateX = dx;
        translateY = dy;
      }
      
      // 新しいtransform属性を設定
      targetElement.attrs.transform = `translate(${translateX},${translateY})`;
      
    } else {
      // 個別要素の場合は座標を直接更新
      switch (targetElement.tag) {
        case 'rect':
        case 'image':
          if (targetElement.attrs.x !== undefined) {
            targetElement.attrs.x = (parseFloat(targetElement.attrs.x) + dx).toString();
          }
          if (targetElement.attrs.y !== undefined) {
            targetElement.attrs.y = (parseFloat(targetElement.attrs.y) + dy).toString();
          }
          break;
          
        case 'circle':
        case 'ellipse':
          if (targetElement.attrs.cx !== undefined) {
            targetElement.attrs.cx = (parseFloat(targetElement.attrs.cx) + dx).toString();
          }
          if (targetElement.attrs.cy !== undefined) {
            targetElement.attrs.cy = (parseFloat(targetElement.attrs.cy) + dy).toString();
          }
          break;
          
        case 'line':
          if (targetElement.attrs.x1 !== undefined) {
            targetElement.attrs.x1 = (parseFloat(targetElement.attrs.x1) + dx).toString();
            targetElement.attrs.x2 = (parseFloat(targetElement.attrs.x2) + dx).toString();
          }
          if (targetElement.attrs.y1 !== undefined) {
            targetElement.attrs.y1 = (parseFloat(targetElement.attrs.y1) + dy).toString();
            targetElement.attrs.y2 = (parseFloat(targetElement.attrs.y2) + dy).toString();
          }
          break;
          
        case 'text':
          if (targetElement.attrs.x !== undefined) {
            targetElement.attrs.x = (parseFloat(targetElement.attrs.x) + dx).toString();
          }
          if (targetElement.attrs.y !== undefined) {
            targetElement.attrs.y = (parseFloat(targetElement.attrs.y) + dy).toString();
          }
          break;
          
        case 'path':
          // パスは複雑なので、transform属性を使用
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
          break;
      }
    }
    
    // JSONテキストを更新
    state.jsonText = JSON.stringify(state.jsonData, null, 2);
    elements.jsonEditor.value = state.jsonText;
    
    // プレビューを更新
    updatePreview();
    
    // 選択情報を更新
    if (state.selectedElement) {
      elements.selectedElementJson.textContent = JSON.stringify(state.selectedElement, null, 2);
    }
  }
  
  // 選択されているモードを取得する関数
  function getSelectedMoveMode() {
    for (const radio of elements.moveModeRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'single'; // デフォルト
  }
  
  // 要素を最前面に移動する関数
  function moveElementToFront(element) {
    // 要素が属する配列を見つける
    const parentArray = findParentArray(element, state.jsonData);
    
    if (parentArray) {
      // 配列から要素を削除
      const index = parentArray.findIndex(el => el.id === element.id);
      if (index !== -1) {
        const removed = parentArray.splice(index, 1)[0];
        // 配列の末尾に追加（最前面になる）
        parentArray.push(removed);
        
        // JSON更新と表示更新
        state.jsonText = JSON.stringify(state.jsonData, null, 2);
        elements.jsonEditor.value = state.jsonText;
        updatePreview();
      }
    }
  }
  
  // 要素を最後面に移動する関数
  function moveElementToBack(element) {
    // 要素が属する配列を見つける
    const parentArray = findParentArray(element, state.jsonData);
    
    if (parentArray) {
      // 配列から要素を削除
      const index = parentArray.findIndex(el => el.id === element.id);
      if (index !== -1) {
        const removed = parentArray.splice(index, 1)[0];
        // 配列の先頭に追加（最後面になる）
        parentArray.unshift(removed);
        
        // JSON更新と表示更新
        state.jsonText = JSON.stringify(state.jsonData, null, 2);
        elements.jsonEditor.value = state.jsonText;
        updatePreview();
      }
    }
  }
  
  // グループを最前面に移動する関数
  function moveGroupToFront(element) {
    // 要素がグループかチェック
    if (element.tag === 'g') {
      // グループ自体を最前面に
      moveElementToFront(element);
    } else {
      // 選択された要素が属するグループを見つける
      const group = findParentGroup(element, state.jsonData);
      if (group) {
        // グループ全体を最前面に
        moveElementToFront(group);
      } else {
        // グループに属していない場合は単一要素として扱う
        moveElementToFront(element);
      }
    }
  }
  
  // グループを最後面に移動する関数
  function moveGroupToBack(element) {
    // 要素がグループかチェック
    if (element.tag === 'g') {
      // グループ自体を最後面に
      moveElementToBack(element);
    } else {
      // 選択された要素が属するグループを見つける
      const group = findParentGroup(element, state.jsonData);
      if (group) {
        // グループ全体を最後面に
        moveElementToBack(group);
      } else {
        // グループに属していない場合は単一要素として扱う
        moveElementToBack(element);
      }
    }
  }
  
  // 親グループを見つける関数
  function findParentGroup(element, jsonData, currentGroup = null) {
    // ルートレベルでチェック
    for (let i = 0; i < jsonData.length; i++) {
      // 現在の要素が探している要素と一致する場合
      if (jsonData[i].id === element.id) {
        return currentGroup; // 親グループがあればそれを返す、なければnull
      }
      
      // グループをチェック
      if (jsonData[i].tag === 'g' && jsonData[i].children) {
        const foundGroup = findParentGroup(element, jsonData[i].children, jsonData[i]);
        if (foundGroup !== undefined) {
          return foundGroup; // 見つかった場合は返す
        }
      }
    }
    
    return undefined; // 見つからなかった
  }
  
  // 要素が属する親配列を見つける関数
  function findParentArray(element, jsonData, currentGroup = null) {
    // 親要素が指定されていれば、その子要素の配列を返す
    if (currentGroup && currentGroup.children) {
      const index = currentGroup.children.findIndex(el => el.id === element.id);
      if (index !== -1) {
        return currentGroup.children;
      }
    }
    
    // ルートレベルで要素を検索
    const rootIndex = jsonData.findIndex(el => el.id === element.id);
    if (rootIndex !== -1) {
      return jsonData;
    }
    
    // グループ内を再帰的に検索
    for (let i = 0; i < jsonData.length; i++) {
      if (jsonData[i].tag === 'g' && jsonData[i].children) {
        const childArray = findParentArray(element, jsonData[i].children, jsonData[i]);
        if (childArray) {
          return childArray;
        }
      }
    }
    
    return null;
  }
  
  // グローバルオブジェクトに参照を追加（モジュール非対応環境用）
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
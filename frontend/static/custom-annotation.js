// custom-annotation.js

class CustomAnnotationWindow {
  constructor() {
    this.createWindow();
    this.bindEvents();
  }

  createWindow() {
    // フローティングウィンドウのHTML要素を作成
    const windowHTML = `
      <div id="annotation-window" class="annotation-window">
        <div class="annotation-window-header">
          <span class="window-title">Annotation Details</span>
          <button class="close-button">&times;</button>
        </div>
        <div class="annotation-window-content">
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', windowHTML);
    this.window = document.getElementById('annotation-window');
    this.content = this.window.querySelector('.annotation-window-content');
  }

  bindEvents() {
    // ウィンドウのドラッグ機能
    const header = this.window.querySelector('.annotation-window-header');
    header.addEventListener('mousedown', this.startDragging.bind(this));

    // 閉じるボタン
    const closeButton = this.window.querySelector('.close-button');
    closeButton.addEventListener('click', () => this.hide());
  }

  startDragging(e) {
    const window = this.window;
    let startX = e.clientX;
    let startY = e.clientY;
    let startLeft = window.offsetLeft;
    let startTop = window.offsetTop;

    function onMouseMove(e) {
      let newLeft = startLeft + (e.clientX - startX);
      let newTop = startTop + (e.clientY - startY);
      window.style.left = `${newLeft}px`;
      window.style.top = `${newTop}px`;
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  show(annotation) {
    // アノテーションの内容を表示
    this.content.innerHTML = this.formatAnnotationContent(annotation);
    this.window.style.display = 'block';
  }

  hide() {
    this.window.style.display = 'none';
  }

  formatAnnotationContent(annotation) {
    // アノテーションの内容をHTML形式に変換
    let html = '';
    if (annotation.title) {
      html += `<h3>${annotation.title}</h3>`;
    }
    if (annotation.description) {
      html += `<p>${annotation.description}</p>`;
    }
    if (annotation.attributes) {
      html += '<table class="annotation-attributes">';
      for (const [key, value] of Object.entries(annotation.attributes)) {
        html += `
          <tr>
            <td class="attribute-key">${key}:</td>
            <td class="attribute-value">${value}</td>
          </tr>
        `;
      }
      html += '</table>';
    }
    return html;
  }
}

export default function initializeCustomAnnotations(viewer) {
  const annotationWindow = new CustomAnnotationWindow();

  // アノテーションクリックイベントをカスタマイズ
  viewer.scene.annotations.traverse((annotation) => {
    if (annotation === viewer.scene.annotations) return true;

    const domElement = annotation.domElement[0];
    if (!domElement) return;

    // 既存のクリックイベントを保持
    const originalOnClick = domElement.onclick;

    domElement.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (originalOnClick) originalOnClick.call(annotation, e);
      } catch (error) {
        console.warn('Original click handler error:', error);
      }

      // カスタムウィンドウを表示
      annotationWindow.show({
        title: annotation.title,
        description: annotation.description,
        attributes: annotation.attributes
      });

      // クリックした位置の近くにウィンドウを表示
      const rect = domElement.getBoundingClientRect();
      annotationWindow.window.style.left = `${rect.right + 10}px`;
      annotationWindow.window.style.top = `${rect.top}px`;
    };
  });
}
import * as THREE from "./potree/libs/three.js/build/three.module.js";
const $ = window.$;

// 仮想ジョイスティックの実装
export function addVirtualJoysticks(viewer) {
  // モバイルデバイスチェック
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) return;

  // ジョイスティックのスタイル定義
  const joystickStyle = {
    position: 'absolute',
    width: '120px',
    height: '120px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '50%',
    touchAction: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  // スティック部分のスタイル
  const stickStyle = {
    position: 'absolute',
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.1s'
  };

  // ジョイスティッククラスの定義
  class VirtualJoystick {
    constructor(options) {
      this.container = $('<div>', {
        css: {
          ...joystickStyle,
          left: options.left,
          bottom: options.bottom
        }
      });

      this.stick = $('<div>', { css: stickStyle });
      this.container.append(this.stick);

      this.centerX = 0;
      this.centerY = 0;
      this.active = false;
      this.value = { x: 0, y: 0 };
      this.touchId = null;  // タッチIDを追跡

      this.setupEvents();
      $(viewer.renderArea).append(this.container);
    }

    setupEvents() {
      // タッチ開始
      this.container.on('touchstart', (e) => {
        // e.preventDefault();
        if (this.active) return;  // 既にアクティブな場合は無視

        const touch = this.findTouch(e.originalEvent.touches);
        if (touch) {
          this.active = true;
          this.touchId = touch.identifier;  // タッチIDを保存
          this.updateStickPosition(touch);
        }
      });

      // タッチ移動
      $(document).on('touchmove', (e) => {
        // e.preventDefault();
        if (!this.active) return;

        const touch = this.findTouchById(e.originalEvent.touches);
        if (touch) {
          this.updateStickPosition(touch);
        }
      });

      // タッチ終了
      $(document).on('touchend touchcancel', (e) => {
        if (!this.active) return;

        // 現在のタッチが終了したかチェック
        const touch = this.findTouchById(e.originalEvent.touches);
        if (!touch) {
          this.active = false;
          this.touchId = null;
          this.resetStick();
        }
      });
    }

    // タッチイベントからこのジョイスティックのための最適なタッチを見つける
    findTouch(touches) {
      const rect = this.container[0].getBoundingClientRect();
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX;
        const y = touch.clientY;

        // タッチがこのジョイスティックの範囲内かチェック
        if (x >= rect.left && x <= rect.right &&
          y >= rect.top && y <= rect.bottom) {
          return touch;
        }
      }
      return null;
    }

    // 特定のタッチIDを持つタッチを見つける
    findTouchById(touches) {
      for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === this.touchId) {
          return touches[i];
        }
      }
      return null;
    }

    updateStickPosition(touch) {
      const rect = this.container[0].getBoundingClientRect();
      const x = touch.clientX - rect.left - rect.width / 2;
      const y = touch.clientY - rect.top - rect.height / 2;

      // スティックの移動範囲を制限
      const angle = Math.atan2(y - this.centerY, x - this.centerX);
      const distance = Math.min(40, Math.hypot(x - this.centerX, y - this.centerY));

      const stickX = this.centerX + distance * Math.cos(angle);
      const stickY = this.centerY + distance * Math.sin(angle);

      this.stick.css('transform', `translate(${stickX}px, ${stickY}px)`);

      // 正規化された値を計算 (-1 から 1 の範囲)
      this.value = {
        x: (stickX - this.centerX) / 40,
        y: (stickY - this.centerY) / 40
      };
    }

    resetStick() {
      this.stick.css('transform', 'translate(0px, 0px)');
      this.value = { x: 0, y: 0 };
    }

    getValue() {
      return this.value;
    }
  }

  // 移動用と視点用の2つのジョイスティックを作成
  const moveJoystick = new VirtualJoystick({
    left: '20px',
    bottom: '20px'
  });

  const lookJoystick = new VirtualJoystick({
    left: 'calc(100% - 140px)',
    bottom: '20px'
  });

  // カメラの移動と回転を更新
  function updateCamera() {
    const moveValue = moveJoystick.getValue();
    const lookValue = lookJoystick.getValue();
    // console.log(moveValue, lookValue);


    if (moveValue.x !== 0 || moveValue.y !== 0) {
      // Potreeのカメラとコントロールを取得
      const camera = viewer.scene.getActiveCamera();

      // 現在のカメラの向きを取得
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

      // 移動量を計算
      const moveDirection = new THREE.Vector3();

      // 移動速度の設定
      const moveSpeed = 1.0;

      // 前後移動
      if (moveValue.y !== 0) {
        moveDirection.add(direction.clone().multiplyScalar(-moveValue.y * moveSpeed));
      }

      // 左右移動
      if (moveValue.x !== 0) {
        moveDirection.add(right.clone().multiplyScalar(moveValue.x * moveSpeed));
      }

      // カメラ位置の更新
      camera.position.add(moveDirection);

      // Potreeのカメラ制御を更新
      viewer.scene.view.position.copy(camera.position);
    }

    if (lookValue.x !== 0 || lookValue.y !== 0) {
      // 回転速度の設定
      const rotateSpeed = 0.025;

      // カメラの回転
      // const camera = viewer.scene.getActiveCamera();
      viewer.scene.view.yaw -= lookValue.x * rotateSpeed;

      // 上下の視点移動を制限付きで適用
      const newPitch = viewer.scene.view.pitch - lookValue.y * rotateSpeed;
      viewer.scene.view.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newPitch));
    }
  }

  // アニメーションループでカメラを更新
  function animate() {
    updateCamera();
    requestAnimationFrame(animate);
  }
  animate();

  // ジョイスティック表示/非表示の切り替えボタン
  const toggleBtn = $('<button>', {
    text: '🎮',
    css: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      padding: '10px',
      fontSize: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      border: 'none',
      borderRadius: '5px',
      zIndex: 1001
    }
  }).click(() => {
    moveJoystick.container.toggle();
    lookJoystick.container.toggle();
  });

  $(viewer.renderArea).append(toggleBtn);

  return {
    moveJoystick,
    lookJoystick,
    // ジョイスティックの有効/無効を切り替え
    setEnabled: (enabled) => {
      moveJoystick.container.toggle(enabled);
      lookJoystick.container.toggle(enabled);
    },
    // 感度設定
    // setSensitivity: (move, look) => {
    //   moveSpeed = move;
    //   rotateSpeed = look;
    // }
  };
}

// カメラ情報の更新関数
export function updateCameraInfo(viewer) {
  const camera = viewer.scene.getActiveCamera();
  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);

  // 位置の更新
  document.getElementById('pos_x').textContent = camera.position.x.toFixed(3);
  document.getElementById('pos_y').textContent = camera.position.y.toFixed(3);
  document.getElementById('pos_z').textContent = camera.position.z.toFixed(3);

  // 回転の更新（ラジアンから度に変換）
  document.getElementById('rot_x').textContent = (euler.x * 180 / Math.PI).toFixed(2);
  document.getElementById('rot_y').textContent = (euler.y * 180 / Math.PI).toFixed(2);
  document.getElementById('rot_z').textContent = (euler.z * 180 / Math.PI).toFixed(2);

  // Up vectorの更新
  document.getElementById('up_x').textContent = camera.up.x.toFixed(3);
  document.getElementById('up_y').textContent = camera.up.y.toFixed(3);
  document.getElementById('up_z').textContent = camera.up.z.toFixed(3);

  requestAnimationFrame(updateCameraInfo);
}
import * as THREE from "./potree/libs/three.js/build/three.module.js";

export default function addPanoramaImage(viewer) {

  // 軸の説明ラベルを追加
  function addAxisLabels() {
    const labelDiv = document.createElement('div');
    labelDiv.style.position = 'absolute';
    labelDiv.style.top = '200px';
    labelDiv.style.right = '10px';
    labelDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    labelDiv.style.color = 'white';
    labelDiv.style.padding = '10px';
    labelDiv.style.fontFamily = 'monospace';
    labelDiv.innerHTML = `
                    <div style="margin-bottom: 5px">Axis Colors:</div>
                    <div style="color: #FF0000">X axis - Red</div>
                    <div style="color: #00FF00">Y axis - Green</div>
                    <div style="color: #0000FF">Z axis - Blue</div>
                `;
    document.getElementById('potree_render_area').appendChild(labelDiv);
  }
  addAxisLabels();



  // シーンのセットアップ時にSkyboxメッシュを作成
  const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
  // 6面分の異なるマテリアルを作成
  const skyboxMaterials = Array(6)
    .fill()
    .map(
      () =>
        new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
        }),
    );
  const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
  viewer.scene.scene.add(skyboxMesh);




  const markerGroup = new THREE.Group();
  viewer.scene.scene.add(markerGroup);

  // 現在のセット番号
  let currentSetIndex = 0;
  let cameraPositions = [];

  // マーカーの初期化
  async function initializeMarkers() {
    cameraPositions = await loadAllCameraPositions();

    cameraPositions.forEach((pos, index) => {
      const marker = createCameraMarker(pos.position, index);
      markerGroup.add(marker);
    });

    // 最初のセットを読み込み、カメラ位置も設定
    if (cameraPositions.length > 0) {
      switchToSet(0);
    }
  }

  // INFファイルからカメラ位置情報を解析する関数
  async function parseInfFile(fileNumber) {
    try {
      const response = await fetch(`./image2d/image2d-${fileNumber}.inf`);
      const text = await response.text();
      const lines = text.split("\n");
      const data = {};

      for (const line of lines) {
        const [key, value] = line.split("=").map((s) => s.trim());
        if (key && value) {
          data[key] = Number.parseFloat(value) || value;
        }
      }

      // 元のクォータニオン
      const originalRotation = new THREE.Quaternion(
        data["pose.rotation.x"],
        data["pose.rotation.y"],
        data["pose.rotation.z"],
        data["pose.rotation.w"],
      );

      // Z-up から Y-up への変換マトリックスを表すクォータニオン
      const coordConversionQuat1 = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0).normalize(), // X軸周りの回転
        (Math.PI / 180) * 90, // 90度回転
      );

      // クォータニオンを合成（座標変換を適用）
      // const convertedRotation = coordConversionQuat.multiply(originalRotation);
      originalRotation.multiply(coordConversionQuat1);

      return {
        position: {
          x: data["pose.translation.x"],
          z: data["pose.translation.z"],
          y: data["pose.translation.y"],
        },
        rotation: {
          x: originalRotation.x,
          y: originalRotation.y,
          z: originalRotation.z,
          w: originalRotation.w,
        },
        name: data.name,
      };
    } catch (error) {
      console.error(`Error loading INF file ${fileNumber}:`, error);
      return null;
    }
  }


  // INFファイルから全カメラ位置を読み込む
  async function loadAllCameraPositions() {
    // document.getElementById("loading").style.display = "block";
    const positions = [];

    for (let i = 0; i < 54; i += 6) {
      const posData = await parseInfFile(i);
      if (posData) {
        positions.push(posData);
      }
    }

    // document.getElementById("loading").style.display = "none";
    return positions;
  }

  // カメラマーカーの作成
  function createCameraMarker(position, index) {
    // 球体のジオメトリを作成 (半径0.3, 幅セグメント16, 高さセグメント16)
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);

    // マテリアルの作成 - 既存の設定を維持しつつ球体用に最適化
    const material = new THREE.MeshBasicMaterial({
      color: 0x4287f5,
      wireframe: false,
      transparent: true,
      opacity: 1,
      depthTest: true
    });

    // 位置の設定
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, position.y, position.z);
    marker.userData.index = index;

    return marker;
  }

  // Skyboxのテクスチャ設定と回転を行う関数
  function switchToSet(index) {
    if (index >= cameraPositions.length) return;

    currentSetIndex = index;
    document.getElementById("currentSet").textContent = currentSetIndex;

    // カメラの位置と回転を設定
    const posData = cameraPositions[index];
    viewer.scene.view.position.set(posData.position.x, posData.position.y, posData.position.z);

    // 各面のテクスチャを個別に読み込む
    const textureLoader = new THREE.TextureLoader();
    const baseIndex = currentSetIndex * 6;
    Promise.all([
      textureLoader.loadAsync(`image2d/image2d-${baseIndex + 2}.jpg`), // Right  (px)
      textureLoader.loadAsync(`image2d/image2d-${baseIndex + 4}.jpg`), // Left   (nx)
      textureLoader.loadAsync(`image2d/image2d-${baseIndex + 5}.jpg`), // Down   (ny)
      textureLoader.loadAsync(`image2d/image2d-${baseIndex + 0}.jpg`), // Up     (py)
      textureLoader.loadAsync(`image2d/image2d-${baseIndex + 1}.jpg`), // Front  (pz)
      textureLoader.loadAsync(`image2d/image2d-${baseIndex + 3}.jpg`), // Back   (nz)
    ]).then((textures) => {
      // 各面にテクスチャを適用
      textures.forEach((texture, i) => {
        texture.flipY = false; // 画像反転を無効化
        skyboxMaterials[i].map = texture;
        skyboxMaterials[i].needsUpdate = true;
      });
    });

    // Skyboxメッシュの位置をカメラに合わせる
    const camera = viewer.scene.getActiveCamera();
    skyboxMesh.position.copy(camera.position);

    // Skyboxの回転を設定
    skyboxMesh.rotation.set(Math.PI, 0, 0); // リセット
    const quaternion = new THREE.Quaternion(
      posData.rotation.x,
      posData.rotation.y,
      posData.rotation.z,
      posData.rotation.w,
    );
    skyboxMesh.setRotationFromQuaternion(quaternion);
    const rot = new THREE.Euler().setFromQuaternion(quaternion);
    console.log(
      `X: ${((rot.x * 180) / Math.PI).toFixed(2)}°, ` +
      `Y: ${((rot.y * 180) / Math.PI).toFixed(2)}°, ` +
      `Z: ${((rot.z * 180) / Math.PI).toFixed(2)}°`,
    );

    // マーカーの表示/非表示を切り替え
    markerGroup.children.forEach((marker, i) => {
      if (i === currentSetIndex) {
        marker.visible = false; // 現在のセットのマーカーを非表示
      } else {
        marker.visible = true; // 他のマーカーは表示
        // marker.material.color.setHex(0xffff00);
      }
    });
  }

  // セット切り替え関数
  window.nextSet = () => {
    switchToSet((currentSetIndex + 1) % (cameraPositions.length || 1));
  };

  window.previousSet = () => {
    switchToSet(
      (currentSetIndex - 1 + (cameraPositions.length || 1)) %
      (cameraPositions.length || 1),
    );
  };


  // レイキャスター設定
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const camera = viewer.scene.getActiveCamera();
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(markerGroup.children);

    if (intersects.length > 0) {
      const index = intersects[0].object.userData.index;
      switchToSet(index);
    }
  }
  window.addEventListener("mousedown", onPointerClick);

  initializeMarkers();
}
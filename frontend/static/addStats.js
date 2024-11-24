import Stats from "./potree/libs/three.js/libs/stats.module.js";

// https://github.com/mrdoob/stats.js
export default function addStats() {
  const stats = new Stats();
  stats.showPanel(0);

  // Potreeのサイドバーの隣に表示
  stats.dom.style.position = 'absolute';
  stats.dom.style.left = '60px';
  stats.dom.style.top = '0px';
  document.getElementById('potree_render_area').appendChild(stats.dom);

  // アニメーションループを使用
  function animate() {
    stats.begin();  // 計測開始
    stats.end();    // 計測終了
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
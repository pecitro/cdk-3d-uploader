<script lang="ts">
  // 県を取得する
  let selected_prefecture = '';
  let isPrefectureLoaded = false;
  let prefectures: string[] = [];

  fetch('/api/list/')
    .then((response) => response.json())
    .then((data) => {
      if (data.prefectures) {
        prefectures = data.prefectures.concat();
        isPrefectureLoaded = true;
      }
      // console.log(data);
      // console.log(prefectures);
    });
  $: fetchFacilities(selected_prefecture); // 県選択時の動作

  // 施設を取得する
  let selected_facility = '';
  let isFacilityLoaded = false;
  let facilities: string[] = [];

  function fetchFacilities(prefecture: string) {
    fetch(`/api/list/${prefecture}/`)
      .then((response) => response.json())
      .then((data) => {
        if (data.facilities) {
          facilities = data.facilities.concat();
          isFacilityLoaded = true;
        }
        // console.log(data);
        // console.log(facilities);
      });
  }
  $: fetchVersions(selected_prefecture, selected_facility); // 県選択時の動作

  // バージョンを取得する
  let selected_version = '';
  let isVersionLoaded = false;
  let versions: string[] = [];

  function fetchVersions(prefecture: string, facility: string) {
    fetch(`/api/list/${prefecture}/${facility}/`)
      .then((response) => response.json())
      .then((data) => {
        if (data.versions) {
          versions = data.versions.concat();
          isVersionLoaded = true;
        }
        // console.log(data);
        // console.log(versions);
      });
  }
  $: fetchViewer(selected_prefecture, selected_facility, selected_version); // バージョン選択時の動作

  // viewerファイルの一覧を選択
  let selected_viewer = '';
  let isViewerLoaded = false;
  let viewerFiles: string[] = [];

  function fetchViewer(prefecture: string, facility: string, version: string) {
    fetch(`/api/list/${prefecture}/${facility}/${version}/viewer/`)
      .then((response) => response.json())
      .then((data) => {
        if (data.files) {
          viewerFiles = data.files.concat();
          isViewerLoaded = true;
        }
        // console.log(data);
        // console.log(viewerFiles);
      });
  }
  $: console.log(
    `${selected_prefecture}/${selected_facility}/${selected_version}/viewer/${selected_viewer}`
  );
</script>

<div class="h-screen bg-gray-200 p-4">
  <div class="max-w mx-auto rounded-lg border border-gray-300 bg-white p-4 shadow-md">
    <h1 class="mb-4 text-3xl font-bold">3Dモデルビューワー</h1>
    <div class="mb-4 flex flex-wrap">
      <div class="mb-4 flex w-1/2 flex-col md:w-1/3 lg:w-1/4 xl:w-1/5">
        <h2 class="mb-2 text-xl font-bold">県選択</h2>
        <select
          name="prefecture"
          bind:value={selected_prefecture}
          size="5"
          class="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700"
        >
          {#if isPrefectureLoaded}
            {#each prefectures as prefecture}
              <option value={prefecture} class="px-4 py-2">{prefecture}</option>
            {/each}
          {/if}
        </select>
      </div>

      <div class="mb-4 flex w-1/2 flex-col md:w-1/3 lg:w-1/4 xl:w-1/5">
        <h2 class="mb-2 text-xl font-bold">施設選択</h2>
        <select
          name="facility"
          bind:value={selected_facility}
          size="5"
          class="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700"
        >
          {#if isFacilityLoaded}
            {#each facilities as facility}
              <option value={facility} class="px-4 py-2">{facility}</option>
            {/each}
          {/if}
        </select>
      </div>

      <div class="mb-4 flex w-1/2 flex-col md:w-1/3 lg:w-1/4 xl:w-1/5">
        <h2 class="mb-2 text-xl font-bold">バージョン選択</h2>
        <select
          name="version"
          bind:value={selected_version}
          size="5"
          class="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700"
        >
          {#if isVersionLoaded}
            {#each versions as version}
              <option value={version} class="px-4 py-2">{version}</option>
            {/each}
          {/if}
        </select>
      </div>

      <div class="mb-4 flex w-1/2 flex-col md:w-1/3 lg:w-1/4 xl:w-1/5">
        <h2 class="mb-2 text-xl font-bold">viewerファイル選択</h2>
        <select
          name="viewer"
          bind:value={selected_viewer}
          size="5"
          class="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700"
        >
          {#if isViewerLoaded}
            {#each viewerFiles as viewer}
              <option value={viewer} class="px-4 py-2">{viewer}</option>
            {/each}
          {/if}
        </select>
      </div>
    </div>

    <a
      href="/potree.html?file={selected_prefecture}/{selected_facility}/{selected_version}/viewer/{selected_viewer}"
      class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      target="_blank"
    >
      Potreeで開く
    </a>
  </div>
</div>

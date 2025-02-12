<script lang="ts">
  import { onMount } from 'svelte';

  type StyleDetail = {
    rootName: string;
    styles: {
      name: string;
      usage: number;
      details: { item: any };
    }[];
    location: any;
    styleType: 'normal' | 'arrow';
  };

  type InlineStyle = {
    raw: string;
    styleObject: Record<string, string | number>;
  };

  let styleList: StyleDetail[] = [];
  let inlineStyles: InlineStyle[] = [];
  const defaultUsedStyles: string[] = [];
  $: selection = '';
  $: unusedStyles = getUnusedStyles(styleList);
  $: isValidStyleSelection = false;
  $: stylesUsed = defaultUsedStyles;
  $: config = {
    highlightColor: '#FFFF00',
    usedStyleColor: '#4daafc',
    unusedStyleColor: '#eb173a',
  };
  $: cssVarStyles = `--highlight-color: ${config.highlightColor}; --used-style-color: ${config.usedStyleColor}; --unused-style-color: ${config.unusedStyleColor};`;
  /* Elements */
  let refreshButton: HTMLDivElement;

  function getUnusedStyles(styleList: StyleDetail[]) {
    const unusedStyles = [];
    for (let styleMain of styleList) {
      for (let style of styleMain.styles) {
        if (style.usage === 0) {
          unusedStyles.push({
            rootName: styleMain.rootName,
            name: style.name,
            ...style.details.item.loc,
          });
        }
      }
    }
    return unusedStyles;
  }

  function fetchStyles() {
    // send message to the extension asking for the selected text
    refreshButton.classList.add('rotate');
    tsvscode.postMessage({ type: 'onFetchStyles', value: '' });
    setTimeout(() => {
      refreshButton.classList.remove('rotate');
    }, 1000);
  }

  function deleteUnusedStyles() {
    tsvscode.postMessage({ type: 'onDelete', value: '' });
  }

  function goToLocation(style: any) {
    tsvscode.postMessage({
      type: 'onClickStyle',
      value: JSON.stringify({ ...style.details.item.loc }),
    });
  }

  function copyStylesInSelection() {
    tsvscode.postMessage({ type: 'copyStylesFromSelection', value: '' });
  }

  function extractStyleIntoStylesheet() {
    tsvscode.postMessage({ type: 'extractStyleIntoStylesheet', value: '' });
  }

  function testing() {
    tsvscode.postMessage({ type: 'testing', value: '' });
  }

  function consolidateInlineStyles() {
    tsvscode.postMessage({ type: 'consolidateInlineStyles', value: '' });
  }

  onMount(() => {
    // Listen for messages from the extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'onReceiveStyles': {
          const result = JSON.parse(message.value);
          styleList = result;
          break;
        }
        case 'onReceiveSelection': {
          const result = JSON.parse(message.value);
          selection = result.selection;
          isValidStyleSelection = result.isValidStyle;
          stylesUsed = result.stylesUsed;
          break;
        }
        case 'removeUnusedStylesSuccess': {
          styleList = styleList.map((rootStyle) => ({
            ...rootStyle,
            styles: rootStyle.styles.filter((style: any) => style.usage !== 0),
          }));
          styleList = styleList.filter((item) => item.styles.length > 0);
          break;
        }
        case 'onReceiveConfig': {
          const result = JSON.parse(message.value);
          config = result;
          break;
        }
        case 'onReceiveInlineStyles': {
          const result = JSON.parse(message.value);
          console.log({ result });
          inlineStyles = result;
          break;
        }
      }
    });

    fetchStyles();
  });
</script>

<div style={cssVarStyles}>
  <div class="headerContainer">
    <h1>Styles Cleaner</h1>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="refresh" on:click={fetchStyles} bind:this={refreshButton}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        fill="#FFF"
        height="15px"
        width="15px"
        version="1.1"
        id="Capa_1"
        viewBox="0 0 489.645 489.645"
        xml:space="preserve"
      >
        <g>
          <path
            d="M460.656,132.911c-58.7-122.1-212.2-166.5-331.8-104.1c-9.4,5.2-13.5,16.6-8.3,27c5.2,9.4,16.6,13.5,27,8.3   c99.9-52,227.4-14.9,276.7,86.3c65.4,134.3-19,236.7-87.4,274.6c-93.1,51.7-211.2,17.4-267.6-70.7l69.3,14.5   c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-122.8-25c-20.6-2-25,16.6-23.9,22.9l15.6,123.8   c1,10.4,9.4,17.7,19.8,17.7c12.8,0,20.8-12.5,19.8-23.9l-6-50.5c57.4,70.8,170.3,131.2,307.4,68.2   C414.856,432.511,548.256,314.811,460.656,132.911z"
          />
        </g>
      </svg>
    </div>
  </div>
  {#if styleList.length > 0}
    <table style="width: 100%;">
      <tr>
        <th style="width:80%; text-align: left;">Unused Styles:</th>
        <th>{unusedStyles.length}</th>
      </tr>
    </table>

    <table style="width: 100%; margin-bottom:10px">
      <tr>
        <th style="width:80%; text-align: left" class="header-label">Name</th>
        <th>Usage</th>
      </tr>
      {#each styleList as item}
        <tr><td colspan="2" /></tr>
        <tr>
          <td colspan="2" class="root-name">{item.rootName}</td>
        </tr>
        {#each item.styles as style}
          <tr>
            <td style="text-align: left">
              <div class="styleKey">
                {#if style.usage === 0}
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  <a href="" class="unused" on:click={() => goToLocation(style)}>
                    {style.name}
                  </a>
                {:else}
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  {#if stylesUsed.includes(`${item.rootName}.${style.name}`)}
                    <a href="" class="used-style highlighted" on:click={() => goToLocation(style)}>
                      {style.name}
                    </a>
                  {:else}
                    <a href="" class="used-style" on:click={() => goToLocation(style)}>
                      {style.name}
                    </a>
                  {/if}
                {/if}
              </div>
            </td>
            <td style="text-align: center">
              {style.usage}
            </td>
          </tr>
        {/each}
      {/each}
    </table>

    <div class="button-container">
      {#if unusedStyles.length > 0}
        <button on:click={deleteUnusedStyles}>Delete Unused Styles</button>
      {/if}
      {#if selection && stylesUsed.length > 0}
        <button on:click={copyStylesInSelection}>Copy Styles in Selection</button>
      {/if}
    </div>
  {:else}
    <p>No Styles Detected</p>
  {/if}
  <div class="button-container">
    {#if isValidStyleSelection}
      <button on:click={extractStyleIntoStylesheet}>Extract into Stylesheet</button>
    {/if}
  </div>
  {#if inlineStyles.length > 0}
    <button style="margin-top: 10px;" on:click={consolidateInlineStyles}>Consolidate Inline Styles</button>
  {/if}
</div>

<style global>
  .headerContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .refresh {
    display: flex;
    align-items: center;
  }

  @keyframes rotateAnimation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .refresh:hover {
    cursor: pointer;
  }

  .rotate {
    animation: rotateAnimation 1s ease forwards;
  }
  .unused {
    color: var(--unused-style-color);
  }

  .root-name {
    font-style: italic;
  }

  .highlighted {
    background-color: var(--highlight-color);
  }

  .used-style {
    color: var(--used-style-color);
  }

  button {
    max-width: 500px;
  }

  .button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .styleKey {
    margin-left: 5px;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';

  let styleName = '';
  let styleList: any = [];
  $: unusedStyles = styleList.filter((style: any) => style.usage === 0)

  function fetchStyles() {
    // send message to the extension asking for the selected text
    tsvscode.postMessage({ type: 'onFetchStyles', value: '' });
  }

  function deleteUnusedStyles() {
    const stylesToDelete = styleList.filter((style: any) => style.usage === 0).map((item: any) => ({style: item.name, ...item.details.item.loc})).reverse()
    tsvscode.postMessage({ type: 'onDelete', value: JSON.stringify(stylesToDelete)});
    styleList = styleList.filter((style: any) => style.usage !== 0)
  }

  onMount(() => {
    // Listen for messages from the extension
    fetchStyles();

    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'onReceiveStyles': {
          const { styles, globalStyleName } = JSON.parse(message.value);
          styleName = globalStyleName;
          const list = [];
          for (let style in styles) {
            list.push({
              name: style,
              ...styles[style],
            });
          }
          styleList = list;
          break;
        }
      }
    });
  });
</script>

<h1>Styles Cleaner</h1>

<table style="width: 100%;">
    <tr>
        <th style="width:80%; text-align: left;">Unused Styles:</th>
        <th>{unusedStyles.length}</th>
    </tr>
</table>

<table style="width: 100%;">
  <tr>
    <th style="width:80%; text-align: left">Name</th>
    <th>Usage</th>
  </tr>
  {#each styleList as style}
    <tr>
      <td style="text-align: left">
        {style.name}
      </td>
      <td style="text-align: center">
        {style.usage}
      </td>
    </tr>
  {/each}
</table>

{#if unusedStyles.length > 0}
  <button on:click={deleteUnusedStyles}>Delete Unused Styles</button>
{/if}

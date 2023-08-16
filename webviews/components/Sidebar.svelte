<script lang="ts">
    import { onMount } from "svelte";

    let text = "";

    function fetchText() {
        // send message to the extension asking for the selected text
        tsvscode.postMessage({ type: "onFetchText", value: "" });
    }

    function fetchStyles() {
        // send message to the extension asking for the selected text
        tsvscode.postMessage({ type: "onFetchStyles", value: "" });
    }

    onMount(() => {
        // Listen for messages from the extension
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "onSelectedText": {
                    text = message.value;
                    break;
                }
                case "onReceiveStyles": {
                    text = message.value;
                    break;
                }
            }
        });
    });
</script>

<h1>Sidebar Panel</h1>
<label for="text"><b>Selected Text</b></label>

<textarea
    rows="15"
    id="text"
    style="resize: vertical;"
    minlength="30"
    bind:value={text}
/>

<button on:click={fetchText}>fetch text</button>
<button on:click={fetchStyles}>Get Styles</button>
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { selection, processImage, updatePreview } from '../stores/selection';
  import { tooltip } from '../actions/tooltip';

  const [initialColor1, initialColor2] = randomComplementaryPalette();
  let currentColor1 = initialColor1;
  let currentColor2 = initialColor2;
  let lastSelectionId = $selection.id;
  let realtimePreview = false;
  let previousRealtimeState = false;
  let previousColor1 = currentColor1;
  let previousColor2 = currentColor2;
  let lastProcessedId = '';

  // Watch for changes in realtime preview
  $: {
    if (previousRealtimeState !== realtimePreview) {
      if (realtimePreview) {
        handleApplyEffect();
      } else if ($selection.fills.length > 0) {
        handleDeleteTopLayer();
      }
      previousRealtimeState = realtimePreview;
    }
  }

  // Apply effect when selection changes and image is loaded
  $: {
    if ($selection.exportedImage && $selection.id !== lastProcessedId) {
      updatePreview(currentColor1, currentColor2);
      lastProcessedId = $selection.id;
    }
  }

  // Update preview when colors change
  $: {
    if (
      $selection.exportedImage &&
      (currentColor1 !== previousColor1 || currentColor2 !== previousColor2)
    ) {
      updatePreview(currentColor1, currentColor2);
      if (realtimePreview) {
        handleApplyEffect();
      }
      previousColor1 = currentColor1;
      previousColor2 = currentColor2;
    }
  }

  function handleApplyEffect(): void {
    processImage(currentColor1, currentColor2, false);
  }

  function handleAddNewLayer(): void {
    processImage(currentColor1, currentColor2, true);
  }

  function handleDeleteTopLayer(): void {
    window.parent.postMessage(
      {
        type: 'delete-top-layer',
      },
      '*'
    );
  }

  function randomComplementaryPalette(): [string, string] {
    const h = Math.floor(Math.random() * 360);
    const s1 = Math.floor(Math.random() * 40) + 60;
    const s2 = Math.floor(Math.random() * 40) + 60;
    const l1 = Math.floor(Math.random() * 30) + 35;
    const l2 = Math.floor(Math.random() * 30) + 35;

    const hueOffset = Math.floor(Math.random() * 60) + 150;

    return [hslToHex(h, s1, l1), hslToHex((h + hueOffset) % 360, s2, l2)];
  }

  function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const color = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function handleRandomColors(): void {
    [currentColor1, currentColor2] = randomComplementaryPalette();
    if (realtimePreview) {
      handleApplyEffect();
    }
  }

  function switchColors(): void {
    const temp = currentColor1;
    currentColor1 = currentColor2;
    currentColor2 = temp;
    if (realtimePreview) {
      handleApplyEffect();
    }
  }

  // Check if controls should be disabled
  $: isDisabled = !$selection.exportedImage;
  $: isProcessing =
    $selection.isPixelizing ||
    $selection.isUploadingFill ||
    $selection.isPreviewLoading;
  $: shouldDisableApply = isDisabled || isProcessing || realtimePreview;
</script>

<div class="flex flex-col gap-4">
  <div class="color-controls flex gap-2">
    <div class="flex w-full justify-between gap-2">
      <div class="color-picker-wrapper flex-1">
        <input
          id="color1"
          type="color"
          value={currentColor1}
          on:change={(e) => {
            currentColor1 = e.currentTarget.value;
          }}
          disabled={isProcessing}
          class="w-full h-10 rounded cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        />
      </div>
      <div class="color-picker-wrapper flex-1">
        <input
          id="color2"
          type="color"
          value={currentColor2}
          on:change={(e) => {
            currentColor2 = e.currentTarget.value;
          }}
          disabled={isProcessing}
          class="w-full h-10 rounded cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        />
      </div>
    </div>
    <button
      use:tooltip={{
        text: 'Swap colors',
        position: 'top',
        maxWidth: 'max-w-[200px]',
      }}
      on:click={switchColors}
      disabled={isProcessing}
      type="button"
      data-appearance="secondary"
      class="h-10 w-10 p-2 flex items-center justify-center"
      aria-label="Generate random colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-arrow-right-left"
        ><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path
          d="m8 21-4-4 4-4"
        /><path d="M4 17h16" /></svg
      >
    </button>
    <button
      use:tooltip={{
        text: 'Randomize colors',
        position: 'left',
        maxWidth: 'max-w-[200px]',
      }}
      on:click={handleRandomColors}
      disabled={isProcessing}
      type="button"
      data-appearance="secondary"
      class="h-10 w-10 p-2 flex items-center justify-center"
      aria-label="Generate random colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-dices"
        ><rect width="12" height="12" x="2" y="10" rx="2" ry="2" /><path
          d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"
        /><path d="M6 18h.01" /><path d="M10 14h.01" /><path
          d="M15 6h.01"
        /><path d="M18 9h.01" /></svg
      >
    </button>
  </div>

  <div class="flex flex-col gap-2 mt-4">
    <div class="checkbox-container flex items-center justify-end gap-2">
      <div
        use:tooltip={{
          text: 'Automatically apply changes while adjusting colors',
          position: 'left',
          maxWidth: 'max-w-[200px]',
        }}
      >
        <label for="realtimePreview" class="text-sm">Realtime</label>
        <input
          id="realtimePreview"
          type="checkbox"
          bind:checked={realtimePreview}
          disabled={isDisabled || isProcessing}
          class="checkbox-input"
        />
      </div>
    </div>
    <button
      on:click={handleApplyEffect}
      data-appearance="primary"
      disabled={shouldDisableApply}
      class:opacity-50={realtimePreview}
      class="flex-1 flex justify-center gap-2 items-center"
      use:tooltip={{
        text: 'Apply duotone effect to the current shape',
        position: 'top',
        maxWidth: 'max-w-[300px]',
      }}
    >
      {realtimePreview ? 'Auto-applying changes' : 'Apply to shape'}
    </button>

    <button
      on:click={handleAddNewLayer}
      disabled={isDisabled || isProcessing}
      data-appearance="primary"
      class="flex-1 flex justify-center gap-2 items-center"
      use:tooltip={{
        text: 'Create a new shape with the duotone effect',
        position: 'bottom',
        maxWidth: 'max-w-[300px]',
      }}
    >
      Create new Shape
    </button>
  </div>
</div>

<style>
  .color-picker-wrapper {
    position: relative;
  }

  .color-picker-wrapper input[type='color'] {
    -webkit-appearance: none;
    padding: 0;
  }

  .color-picker-wrapper input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-picker-wrapper input[type='color']::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }

  .color-picker-wrapper input[type='color']::-moz-color-swatch {
    border: none;
    border-radius: 4px;
  }
</style>

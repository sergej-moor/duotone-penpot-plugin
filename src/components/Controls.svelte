<script lang="ts">
  import { onDestroy } from 'svelte';
  import { selection, processImage, updatePreview } from '../stores/selection';
  import { tooltip } from '../actions/tooltip';

  let currentColor1 = '#FF0000'; // Default red
  let currentColor2 = '#0000FF'; // Default blue
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

  // Check if controls should be disabled
  $: isDisabled = !$selection.exportedImage;
  $: isProcessing =
    $selection.isPixelizing ||
    $selection.isUploadingFill ||
    $selection.isPreviewLoading;
  $: shouldDisableApply = isDisabled || isProcessing || realtimePreview;
</script>

<div class="flex flex-col gap-4">
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

  <div class="color-controls flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <label for="color1" class="text-sm">Color 1:</label>
      <input
        id="color1"
        type="color"
        bind:value={currentColor1}
        disabled={isDisabled || isProcessing}
        class="flex-1"
      />
    </div>
    <div class="flex items-center gap-2">
      <label for="color2" class="text-sm">Color 2:</label>
      <input
        id="color2"
        type="color"
        bind:value={currentColor2}
        disabled={isDisabled || isProcessing}
        class="flex-1"
      />
    </div>
    <button
      on:click={handleRandomColors}
      disabled={isDisabled || isProcessing}
      class="text-sm"
    >
      Random Colors
    </button>
  </div>

  <div class="flex flex-col gap-2">
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

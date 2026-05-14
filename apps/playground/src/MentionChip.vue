<script setup lang="ts">
import { useQuolt } from 'quolt-vue';

defineProps<{
  value: { id: string; name: string };
}>();

const editor = useQuolt();

function logEditor() {
  // Demonstrates that an embed component can reach back into the host editor.
  // editor.value will be the QuoltEditor instance after mount.
  // eslint-disable-next-line no-console
  console.log('mention clicked, editor:', editor.value);
}
</script>

<template>
  <span class="mention-chip" @click="logEditor">{{ value.name }}</span>
</template>

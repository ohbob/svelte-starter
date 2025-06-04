<script lang="ts">
	import AvailabilityTemplateForm from "$lib/components/AvailabilityTemplateForm.svelte";

	let { data } = $props();
</script>

<svelte:head>
	<title>Create Availability Template | Calendar</title>
</svelte:head>

<AvailabilityTemplateForm template={null} isEdit={false} />

<script lang="ts">
	import AvailabilityTemplateForm from "$lib/components/AvailabilityTemplateForm.svelte";

	let { data } = $props();
</script>

<svelte:head>
	<title>Edit {data.template.name}</title>
</svelte:head>

<AvailabilityTemplateForm template={data.template} isEdit={true} />

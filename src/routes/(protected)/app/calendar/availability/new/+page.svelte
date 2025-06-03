<script>
	import AvailabilityTemplateForm from "$lib/components/AvailabilityTemplateForm.svelte";

	let { data } = $props();
</script>

<svelte:head>
	<title>Create Availability Template</title>
</svelte:head>

<AvailabilityTemplateForm isEdit={false} />

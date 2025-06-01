<script>
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	onMount(() => {
		goto("/app/website/services", { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-12">
	<div class="text-center">
		<div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
		<p class="text-gray-600">Redirecting to Website Services...</p>
	</div>
</div>

<script lang="ts">
	let { size = "md", class: className = "" } = $props();

	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	};
</script>

<div class="loading-container {className}">
	<div class="loading-spinner {sizeClasses[size]}"></div>
</div>

<script>
	import { browser } from "$app/environment";
	import { toast } from "svelte-sonner";

	let {
		label,
		value = $bindable(""),
		placeholder = "",
		type = "text",
		icon,
		iconColor = "blue",
		companyId,
		fieldName,
		rows = undefined,
		saving = $bindable(false),
		lastSaved = $bindable(null),
		onInput = undefined,
	} = $props();

	// Debounce timer
	let debounceTimer;

	// Auto-save function
	const autoSave = async (newValue) => {
		if (!browser || !companyId) return;

		saving = true;

		try {
			const response = await fetch(`/api/companies/${companyId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [fieldName]: newValue }),
			});

			if (response.ok) {
				lastSaved = new Date();
				toast.success(`${label} updated`);
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to update");
			}
		} catch (error) {
			toast.error("Failed to update");
		} finally {
			saving = false;
		}
	};

	// Debounced input handler
	const handleInput = (newValue) => {
		value = newValue;

		// Clear existing timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Set new timer
		debounceTimer = setTimeout(() => {
			autoSave(newValue);
		}, 1000); // 1 second debounce

		// Call custom onInput if provided
		if (onInput) {
			onInput(newValue);
		}
	};

	// Color classes for icons
	const colorClasses = {
		blue: "bg-blue-100 text-blue-600",
		green: "bg-green-100 text-green-600",
		purple: "bg-purple-100 text-purple-600",
		orange: "bg-orange-100 text-orange-600",
		red: "bg-red-100 text-red-600",
		indigo: "bg-indigo-100 text-indigo-600",
		gray: "bg-gray-100 text-gray-600",
	};
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6">
	<div class="flex items-center justify-between">
		<div class="flex-1">
			<div class="text-sm font-medium text-gray-500">{label}</div>
			{#if rows}
				<textarea
					bind:value
					oninput={(e) => handleInput(e.target.value)}
					{placeholder}
					{rows}
					class="w-full resize-none border-none bg-transparent p-0 text-lg font-semibold text-gray-900 placeholder-gray-400 outline-none focus:ring-0"
				></textarea>
			{:else}
				<input
					{type}
					bind:value
					oninput={(e) => handleInput(e.target.value)}
					{placeholder}
					class="w-full border-none bg-transparent p-0 text-lg font-semibold text-gray-900 placeholder-gray-400 outline-none focus:ring-0"
				/>
			{/if}
			{#if saving}
				<div class="mt-1 text-xs text-blue-600">Saving...</div>
			{:else if lastSaved}
				<div class="mt-1 text-xs text-green-600">✓ Saved</div>
			{/if}
		</div>
		{#if icon}
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg {colorClasses[iconColor]} ml-4"
			>
				{@html icon}
			</div>
		{/if}
	</div>
</div>

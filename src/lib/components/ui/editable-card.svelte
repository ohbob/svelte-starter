<script>
	import { browser } from "$app/environment";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";

	let {
		label,
		value = $bindable(""),
		placeholder = "",
		type = "text",
		icon,
		iconColor = "blue",
		fieldName,
		rows = undefined,
		saving = $bindable(false),
		lastSaved = $bindable(null),
		onInput = undefined,
	} = $props();

	// Debounce timer
	let debounceTimer;
	let formElement;

	// Auto-save function using form submission
	const autoSave = async (newValue) => {
		if (!browser || !formElement) return;

		saving = true;

		// Create form data and submit
		const formData = new FormData();
		formData.append("field", fieldName);
		formData.append("value", newValue);

		try {
			const response = await fetch("?/updateCompany", {
				method: "POST",
				body: formData,
				headers: {
					"x-sveltekit-action": "true",
				},
			});

			const result = await response.json();

			if (result.type === "success") {
				lastSaved = new Date();
				toast.success(`${label} updated`);
			} else if (result.type === "failure") {
				toast.error(result.data?.error || "Failed to update");
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

<!-- Hidden form for form actions -->
<form
	bind:this={formElement}
	method="POST"
	action="?/updateCompany"
	use:enhance={() => {
		return async ({ result }) => {
			// Handle result in autoSave function
		};
	}}
	style="display: none;"
>
	<input type="hidden" name="field" value={fieldName} />
	<input type="hidden" name="value" bind:value />
</form>

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

<script lang="ts">
	let {
		label,
		checked = $bindable(),
		disabled = false,
		id,
		class: className = "",
		...restProps
	} = $props();

	const fieldId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="flex items-center {className}">
	<input {id} type="checkbox" {disabled} bind:checked class="mr-2" {...restProps} />
	<label for={fieldId} class="text-sm text-gray-700">
		{label}
	</label>
</div>

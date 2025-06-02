<script lang="ts">
	let {
		label,
		type = "text",
		value = $bindable(),
		placeholder,
		required = false,
		disabled = false,
		error,
		help,
		id,
		class: className = "",
		...restProps
	} = $props();

	const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="form-field {className}">
	<label for={fieldId} class="label-base" class:required>
		{label}
		{#if required}<span class="text-red-500">*</span>{/if}
	</label>

	<input
		id={fieldId}
		{type}
		{placeholder}
		{required}
		{disabled}
		bind:value
		class="input-base"
		class:error
		aria-describedby={help || error ? `${fieldId}-help` : undefined}
		{...restProps}
	/>

	{#if error}
		<p id="{fieldId}-help" class="mt-1 text-xs text-red-600">
			{error}
		</p>
	{:else if help}
		<p id="{fieldId}-help" class="mt-1 text-xs text-gray-500">
			{help}
		</p>
	{/if}
</div>

<style>
	.form-field {
		@apply space-y-1;
	}

	.input-base.error {
		@apply border-red-300 focus:border-red-500 focus:ring-red-500;
	}

	.label-base.required {
		@apply after:ml-1 after:text-red-500 after:content-['*'];
	}
</style>

<script>
	let { label, options = [], selectedValues = $bindable([]), class: className = "" } = $props();

	function handleToggle(value, event) {
		if (event.target.checked) {
			selectedValues = [...selectedValues, value];
		} else {
			selectedValues = selectedValues.filter((v) => v !== value);
		}
	}
</script>

<div class={className}>
	<div class="label-base mb-2">{label}</div>
	<div class="grid grid-cols-2 gap-1 text-sm">
		{#each options as option}
			<div class="flex items-center">
				<input
					type="checkbox"
					checked={selectedValues.includes(option)}
					onchange={(e) => handleToggle(option, e)}
					id="{label}-{option}"
					class="mr-1"
				/>
				<label for="{label}-{option}" class="text-sm text-gray-700">
					{option}
				</label>
			</div>
		{/each}
	</div>
</div>

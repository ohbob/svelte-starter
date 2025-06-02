<script>
	import { Button } from "$lib/components/ui/button";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { page } from "$app/stores";

	let { companies = [], currentCompany = null } = $props();

	// Make company data reactive using $derived
	const reactiveCompanies = $derived(companies || []);
	const reactiveCurrentCompany = $derived(currentCompany);

	let showDropdown = $state(false);
	let showCreateModal = $state(false);
	let isSubmitting = $state(false);

	// Form state for creating new company
	let formData = $state({
		name: "",
		description: "",
	});

	const resetForm = () => {
		formData = {
			name: "",
			description: "",
		};
	};

	const toggleDropdown = () => {
		showDropdown = !showDropdown;
	};

	const openCreateModal = () => {
		showDropdown = false;
		showCreateModal = true;
	};

	const closeCreateModal = () => {
		showCreateModal = false;
		resetForm();
	};

	// Close dropdown when clicking outside
	const handleClickOutside = (event) => {
		if (!event.target.closest(".company-selector")) {
			showDropdown = false;
		}
	};

	$effect(() => {
		if (showDropdown) {
			document.addEventListener("click", handleClickOutside);
			return () => document.removeEventListener("click", handleClickOutside);
		}
	});
</script>

<div class="company-selector relative">
	<button
		onclick={toggleDropdown}
		class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
	>
		<div class="flex items-center gap-2">
			{#if reactiveCurrentCompany}
				<div
					class="flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-xs font-semibold text-white"
				>
					{reactiveCurrentCompany.name.charAt(0).toUpperCase()}
				</div>
				<span class="w-32 truncate">{reactiveCurrentCompany.name}</span>
			{:else}
				<div
					class="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-400"
				>
					?
				</div>
				<span class="text-gray-500">Select Company</span>
			{/if}
		</div>
		<svg
			class="h-4 w-4 text-gray-400 transition-transform {showDropdown ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
			></path>
		</svg>
	</button>

	{#if showDropdown}
		<div
			class="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
		>
			{#if reactiveCompanies.length === 0}
				<div class="px-3 py-2 text-sm text-gray-500">No companies yet</div>
			{:else}
				{#each reactiveCompanies as company}
					<form
						method="POST"
						action="/app?/selectCompany"
						use:enhance={() => {
							isSubmitting = true;
							showDropdown = false;
							return async ({ result, update }) => {
								isSubmitting = false;
								if (result.type === "success") {
									// Invalidate all data to refresh layout with new selected company
									await invalidateAll();
								} else {
									// Update the form if there are errors
									await update();
								}
							};
						}}
						class="w-full"
					>
						<input type="hidden" name="companyId" value={company.id} />
						<button
							type="submit"
							disabled={isSubmitting}
							class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 {reactiveCurrentCompany?.id ===
							company.id
								? 'bg-blue-50 text-blue-700'
								: 'text-gray-700'} disabled:opacity-50"
							aria-label="Select {company.name}"
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-sm font-semibold text-white"
							>
								{company.name.charAt(0).toUpperCase()}
							</div>
							<div class="min-w-0 flex-1">
								<div class="truncate font-medium">{company.name}</div>
							</div>
							{#if reactiveCurrentCompany?.id === company.id}
								<svg
									class="h-4 w-4 text-blue-600"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-label="Currently selected"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
							{/if}
						</button>
					</form>
				{/each}
			{/if}

			<div class="mt-1 border-t border-gray-100 pt-1">
				<button
					onclick={openCreateModal}
					class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
					aria-label="Create new company"
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded border-2 border-dashed border-gray-300"
					>
						<svg
							class="h-4 w-4 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							></path>
						</svg>
					</div>
					<div class="min-w-0 flex-1">
						<div class="font-medium">Create New Company</div>
						<div class="text-xs text-gray-500">Add a new company to your account</div>
					</div>
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Create Company Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-semibold">Create New Company</h3>

			<form
				method="POST"
				action="/app?/createCompany"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						isSubmitting = false;
						if (result.type === "success") {
							// Reset form and close modal
							closeCreateModal();
							// Invalidate all data to refresh layout with new company list and selection
							await invalidateAll();
						} else {
							// Update the form if there are errors
							await update();
						}
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="company-name" class="mb-1 block text-sm font-medium text-gray-700">
						Company Name *
					</label>
					<input
						id="company-name"
						name="name"
						type="text"
						required
						bind:value={formData.name}
						placeholder="Enter company name"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						disabled={isSubmitting}
					/>
				</div>

				<div>
					<label for="company-description" class="mb-1 block text-sm font-medium text-gray-700">
						Description
					</label>
					<textarea
						id="company-description"
						name="description"
						bind:value={formData.description}
						placeholder="Brief description (optional)"
						rows="3"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						disabled={isSubmitting}
					></textarea>
				</div>

				<div class="flex gap-3 pt-2">
					<Button type="submit" disabled={!formData.name.trim() || isSubmitting} class="flex-1">
						{isSubmitting ? "Creating..." : "Create Company"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onclick={closeCreateModal}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
				</div>
			</form>

			{#if $page.form?.error}
				<div class="mt-3 text-sm text-red-600">
					{$page.form.error}
				</div>
			{/if}
		</div>
	</div>
{/if}

<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { page } from "$app/stores";

	/**
	 * @typedef {Object} Company
	 * @property {string} id
	 * @property {string} name
	 * @property {string} slug
	 */

	/**
	 * @type {{
	 *   companies: Company[];
	 *   selectedCompanyId: string | null;
	 * }}
	 */
	let { companies, selectedCompanyId } = $props();

	let showCreateForm = $state(false);
	let isSubmitting = $state(false);
	let createFormData = $state({
		name: "",
		description: "",
	});

	const toggleCreateForm = () => {
		showCreateForm = !showCreateForm;
		if (!showCreateForm) {
			createFormData = { name: "", description: "" };
		}
	};
</script>

<div class="company-selector">
	<div class="mb-4">
		<h3 class="mb-2 text-lg font-semibold">Select Company</h3>

		{#each companies as company}
			<form
				method="POST"
				action="?/selectCompany"
				use:enhance={() => {
					isSubmitting = true;
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
				class="mb-2"
			>
				<input type="hidden" name="companyId" value={company.id} />
				<Button
					type="submit"
					variant={selectedCompanyId === company.id ? "default" : "outline"}
					class="w-full justify-start"
					disabled={isSubmitting}
				>
					{company.name}
					{#if selectedCompanyId === company.id}
						<span class="ml-2 text-xs">(Current)</span>
					{/if}
				</Button>
			</form>
		{/each}
	</div>

	<div class="border-t pt-4">
		{#if !showCreateForm}
			<Button onclick={toggleCreateForm} variant="outline" class="w-full">
				+ Create New Company
			</Button>
		{:else}
			<div class="space-y-4">
				<h4 class="font-medium">Create New Company</h4>

				<form
					method="POST"
					action="?/createCompany"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							if (result.type === "success") {
								// Reset form and hide it
								showCreateForm = false;
								createFormData = { name: "", description: "" };
								// Invalidate all data to refresh layout with new company list and selection
								await invalidateAll();
							} else {
								// Update the form if there are errors
								await update();
							}
						};
					}}
					class="space-y-3"
				>
					<div>
						<label for="company-name" class="mb-1 block text-sm font-medium">
							Company Name *
						</label>
						<input
							id="company-name"
							name="name"
							type="text"
							required
							bind:value={createFormData.name}
							placeholder="Enter company name"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label for="company-description" class="mb-1 block text-sm font-medium">
							Description
						</label>
						<textarea
							id="company-description"
							name="description"
							bind:value={createFormData.description}
							placeholder="Brief description (optional)"
							rows="2"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isSubmitting}
						></textarea>
					</div>

					<div class="flex gap-2">
						<Button
							type="submit"
							disabled={!createFormData.name.trim() || isSubmitting}
							class="flex-1"
						>
							{isSubmitting ? "Creating..." : "Create Company"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onclick={toggleCreateForm}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
					</div>
				</form>

				{#if $page.form?.error}
					<div class="mt-2 text-sm text-red-600">
						{$page.form.error}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.company-selector {
		min-width: 300px;
	}
</style>

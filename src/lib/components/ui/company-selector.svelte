<script>
	import { Button } from "$lib/components/ui/button";
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";

	let { companies = [], currentCompany = null } = $props();

	let showDropdown = $state(false);
	let showCreateModal = $state(false);
	let isCreating = $state(false);

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

	const selectCompany = async (company) => {
		showDropdown = false;

		try {
			// Set the cookie on the server side
			const response = await fetch("/api/companies/select", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ companyId: company.id }),
			});

			if (response.ok) {
				// Use SvelteKit navigation to refresh the current page
				goto($page.url.pathname, { invalidateAll: true });
			} else {
				toast.error("Failed to switch company");
			}
		} catch (error) {
			console.error("Error switching company:", error);
			toast.error("Failed to switch company");
		}
	};

	const openCreateModal = () => {
		showDropdown = false;
		showCreateModal = true;
	};

	const closeCreateModal = () => {
		showCreateModal = false;
		resetForm();
	};

	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		isCreating = true;

		try {
			const response = await fetch("/api/companies", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const result = await response.json();
				toast.success("Company created successfully!");

				// Select the new company using the same method
				const selectResponse = await fetch("/api/companies/select", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ companyId: result.company.id }),
				});

				closeCreateModal();

				if (selectResponse.ok) {
					goto($page.url.pathname, { invalidateAll: true });
				} else {
					window.location.reload(); // Fallback
				}
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to create company");
			}
		} catch (error) {
			toast.error("An error occurred while creating the company");
		} finally {
			isCreating = false;
		}
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
			{#if currentCompany}
				<div
					class="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-semibold text-blue-600"
				>
					{currentCompany.name.charAt(0).toUpperCase()}
				</div>
				<span class="max-w-32 truncate">{currentCompany.name}</span>
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
			{#if companies.length === 0}
				<div class="px-3 py-2 text-sm text-gray-500">No companies yet</div>
			{:else}
				{#each companies as company}
					<button
						onclick={() => selectCompany(company)}
						class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 {currentCompany?.id ===
						company.id
							? 'bg-blue-50 text-blue-700'
							: 'text-gray-700'}"
						aria-label="Select {company.name}"
					>
						<div
							class="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-600"
						>
							{company.name.charAt(0).toUpperCase()}
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate font-medium">{company.name}</div>
							{#if company.description}
								<div class="truncate text-xs text-gray-500">{company.description}</div>
							{/if}
						</div>
						{#if currentCompany?.id === company.id}
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
					<span class="font-medium">Create new company</span>
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Create Company Modal -->
{#if showCreateModal}
	<div
		class="fixed inset-0 z-50 bg-black bg-opacity-50"
		onclick={closeCreateModal}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		onkeydown={(e) => e.key === "Escape" && closeCreateModal()}
	>
		<div class="flex min-h-full items-center justify-center p-4">
			<div
				class="w-full max-w-md rounded-lg bg-white p-6"
				onclick={(e) => e.stopPropagation()}
				role="document"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 id="modal-title" class="text-xl font-semibold text-gray-900">Create New Company</h2>
					<button
						onclick={closeCreateModal}
						class="text-gray-400 hover:text-gray-600"
						aria-label="Close modal"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<form onsubmit={handleCreateSubmit} class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700">Company Name *</label>
						<input
							type="text"
							id="name"
							bind:value={formData.name}
							required
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							placeholder="Enter company name"
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700"
							>Description</label
						>
						<textarea
							id="description"
							bind:value={formData.description}
							rows="3"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							placeholder="Brief description of your company"
						></textarea>
					</div>

					<div class="flex gap-3 pt-4">
						<Button type="button" variant="outline" onclick={closeCreateModal} class="flex-1">
							Cancel
						</Button>
						<Button type="submit" disabled={isCreating} class="flex-1">
							{isCreating ? "Creating..." : "Create Company"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

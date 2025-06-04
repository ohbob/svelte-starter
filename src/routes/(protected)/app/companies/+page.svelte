<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import { toast } from "$lib/utils/toast";
	import CompanySelector from "$lib/components/ui/company-selector.svelte";

	let { data } = $props();

	let showAddModal = $state(false);
	let isLoading = $state(false);

	let formData = $state({
		name: "",
		address: "",
		phone: "",
		email: "",
		city: "",
		state: "",
		country: "",
		vat: "",
		regNr: "",
		description: "",
	});

	const resetForm = () => {
		formData = {
			name: "",
			address: "",
			phone: "",
			email: "",
			city: "",
			state: "",
			country: "",
			vat: "",
			regNr: "",
			description: "",
		};
	};

	// Form action handler
	const handleCreateEnhance = () => {
		isLoading = true;
		return async ({ result, update }) => {
			if (result.type === "success") {
				toast.success("Company created successfully!");
				resetForm();
				showAddModal = false;
				// Refresh the page to show new company
				window.location.reload();
			} else if (result.type === "failure") {
				toast.error(result.data?.error || "Failed to create company");
			}
			await update();
			isLoading = false;
		};
	};

	const openModal = () => {
		showAddModal = true;
	};

	const closeModal = () => {
		showAddModal = false;
	};
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">Companies</h1>
		<p class="mt-2 text-gray-600">
			Manage your companies and switch between them using the selector in the header.
		</p>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-8">
		<div class="text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
				<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					></path>
				</svg>
			</div>
			<h3 class="mt-4 text-lg font-medium text-gray-900">Company Management</h3>
			<p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
				Use the company selector in the header to switch between your companies or create new ones.
				All your data (calendar, analytics, etc.) is organized by company.
			</p>

			<div class="mt-6 flex justify-center">
				<CompanySelector companies={data.companies} currentCompany={data.currentCompany} />
			</div>
		</div>

		{#if data.companies.length > 0}
			<div class="mt-8 border-t border-gray-200 pt-8">
				<h4 class="mb-4 text-sm font-medium text-gray-900">Your Companies</h4>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.companies as company}
						<div
							class="relative rounded-lg border border-gray-200 bg-gray-50 p-4 {data.currentCompany
								?.id === company.id
								? 'bg-blue-50 ring-2 ring-blue-500'
								: ''}"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white"
								>
									{company.name.charAt(0).toUpperCase()}
								</div>
								<div class="min-w-0 flex-1">
									<h5 class="truncate font-medium text-gray-900">{company.name}</h5>
									{#if company.description}
										<p class="truncate text-sm text-gray-500">{company.description}</p>
									{/if}
								</div>
								{#if data.currentCompany?.id === company.id}
									<div class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
										<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											></path>
										</svg>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Add Company Modal -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 bg-black bg-opacity-50" on:click={closeModal}>
		<div class="flex min-h-full items-center justify-center p-4">
			<div class="w-full max-w-2xl rounded-lg bg-white p-6" on:click={(e) => e.stopPropagation()}>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Add New Company</h2>
					<button on:click={closeModal} class="text-gray-400 hover:text-gray-600">
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

				<form method="POST" action="?/create" use:enhance={handleCreateEnhance} class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700"
								>Company Name *</label
							>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={formData.name}
								required
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={formData.email}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								bind:value={formData.phone}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="vat" class="block text-sm font-medium text-gray-700">VAT Number</label>
							<input
								type="text"
								id="vat"
								name="vat"
								bind:value={formData.vat}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="regNr" class="block text-sm font-medium text-gray-700"
								>Registration Number</label
							>
							<input
								type="text"
								id="regNr"
								name="regNr"
								bind:value={formData.regNr}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="country" class="block text-sm font-medium text-gray-700">Country</label>
							<input
								type="text"
								id="country"
								name="country"
								bind:value={formData.country}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="state" class="block text-sm font-medium text-gray-700"
								>State/Province</label
							>
							<input
								type="text"
								id="state"
								name="state"
								bind:value={formData.state}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label for="city" class="block text-sm font-medium text-gray-700">City</label>
							<input
								type="text"
								id="city"
								name="city"
								bind:value={formData.city}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div>
						<label for="address" class="block text-sm font-medium text-gray-700">Address</label>
						<input
							type="text"
							id="address"
							name="address"
							bind:value={formData.address}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700"
							>Description</label
						>
						<textarea
							id="description"
							name="description"
							bind:value={formData.description}
							rows="3"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						></textarea>
					</div>

					<div class="flex justify-end gap-3">
						<button
							type="button"
							on:click={closeModal}
							class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
						>
							{isLoading ? "Creating..." : "Create Company"}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

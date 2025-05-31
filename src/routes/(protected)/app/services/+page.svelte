<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { toast, notification } from "$lib/utils/toast";

	let { data, form } = $props();

	// Edit state
	let editingService = $state(null);

	// Form state variables
	let formTitle = $state("");
	let formPrice = $state("");
	let formCategory = $state("");
	let formDescription = $state("");
	let formIsActive = $state(true);

	// Search state
	let searchQuery = $state("");
	let filteredServices = $state(data.services);

	// Show toast notifications based on form results
	$effect(() => {
		if (form?.success) {
			if (form.action === "create") {
				toast.success("Service created successfully!");
			} else if (form.action === "update") {
				toast.success("Service updated successfully!");
			} else if (form.action === "delete") {
				toast.success("Service deleted successfully!");
			}
		} else if (form?.error) {
			toast.error(form.error);
		}
	});

	// Update filtered services when search changes
	$effect(() => {
		if (!searchQuery.trim()) {
			filteredServices = data.services;
		} else {
			const query = searchQuery.toLowerCase();
			filteredServices = data.services.filter(
				(service) =>
					service.title.toLowerCase().includes(query) ||
					service.description.toLowerCase().includes(query) ||
					(service.category && service.category.toLowerCase().includes(query)) ||
					service.price.toLowerCase().includes(query)
			);
		}
	});

	const handleEdit = (service) => {
		editingService = service;
		formTitle = service.title || "";
		formPrice = service.price || "";
		formCategory = service.category || "";
		formDescription = service.description || "";
		formIsActive = service.isActive ?? true;
	};

	const cancelEdit = () => {
		editingService = null;
		formTitle = "";
		formPrice = "";
		formCategory = "";
		formDescription = "";
		formIsActive = true;
	};

	const openAddModal = () => {
		editingService = {
			id: null,
			title: "",
			price: "",
			category: "",
			description: "",
			isActive: true,
		};
		formTitle = "";
		formPrice = "";
		formCategory = "";
		formDescription = "";
		formIsActive = true;
	};

	const handleDelete = async (serviceId) => {
		if (!confirm("Are you sure you want to delete this service?")) {
			return;
		}

		// Show immediate feedback
		toast.info("Deleting service...");

		// Submit the hidden delete form
		const deleteForm = document.getElementById(`delete-form-${serviceId}`);
		if (deleteForm) {
			deleteForm.requestSubmit();
		}
	};

	// Create wrapper functions for onclick handlers
	const createEditHandler = (service) => () => handleEdit(service);
	const createDeleteHandler = (serviceId) => () => handleDelete(serviceId);

	// Handle escape key to close modal
	const handleKeydown = (event) => {
		if (event.key === "Escape" && editingService) {
			cancelEdit();
		}
	};

	// Add/remove event listener when modal opens/closes
	$effect(() => {
		if (editingService) {
			document.addEventListener("keydown", handleKeydown);
		} else {
			document.removeEventListener("keydown", handleKeydown);
		}

		// Cleanup on component unmount
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	});
</script>

<div class="p-6">
	<!-- Header with Search and Add Button -->
	<div class="mb-6">
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Services</h1>
				<p class="mt-1 text-sm text-gray-500">Manage your portfolio services</p>
			</div>
			<button
				onclick={openAddModal}
				class="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				Add Service
			</button>
		</div>

		<div class="relative">
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search services..."
				class="w-80 rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	</div>

	<!-- Services Table -->
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
		<div class="border-b border-gray-200 px-6 py-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Your Services</h2>
				<div class="text-sm text-gray-500">{filteredServices.length} services</div>
			</div>
		</div>
		<div class="p-6">
			{#if filteredServices.length === 0}
				<div class="py-12 text-center">
					<svg
						class="mx-auto mb-4 h-16 w-16 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<h3 class="mb-2 text-lg font-medium text-gray-900">
						{searchQuery.trim() ? "No services found" : "No services yet"}
					</h3>
					<p class="text-sm text-gray-500">
						{searchQuery.trim()
							? "Try adjusting your search terms"
							: "Add your first service to get started"}
					</p>
					{#if !searchQuery.trim()}
						<button
							onclick={openAddModal}
							class="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Add Your First Service
						</button>
					{/if}
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="border-b border-gray-200">
							<tr>
								<th class="px-4 py-3 text-left font-medium text-gray-900">Service</th>
								<th class="px-4 py-3 text-left font-medium text-gray-900">Category</th>
								<th class="px-4 py-3 text-left font-medium text-gray-900">Price</th>
								<th class="px-4 py-3 text-right font-medium text-gray-900">Status</th>
								<th class="px-4 py-3 text-right font-medium text-gray-900">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each filteredServices as service, index}
								<tr class="cursor-pointer hover:bg-gray-50" onclick={createEditHandler(service)}>
									<td class="px-4 py-4">
										<div class="flex items-center gap-3">
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600"
											>
												{index + 1}
											</div>
											<div>
												<div class="text-sm font-medium text-gray-900">{service.title}</div>
												<div class="max-w-xs truncate text-sm text-gray-500">
													{service.description}
												</div>
											</div>
										</div>
									</td>
									<td class="px-4 py-4">
										<span class="text-sm text-gray-600">{service.category || "Uncategorized"}</span>
									</td>
									<td class="px-4 py-4">
										<span class="text-sm font-medium text-gray-900">{service.price}</span>
									</td>
									<td class="px-4 py-4 text-right">
										<div class="flex items-center justify-end gap-2">
											<div class="h-2 w-16 rounded-full bg-gray-200">
												<div
													class="h-2 rounded-full bg-blue-500"
													style:width="{service.isActive ? 100 : 0}%"
												></div>
											</div>
											<span class="w-10 text-right text-sm text-gray-500">
												{service.isActive ? "Active" : "Inactive"}
											</span>
										</div>
									</td>
									<td class="px-4 py-4 text-right">
										<div
											class="flex items-center justify-end gap-2"
											onclick={(e) => e.stopPropagation()}
										>
											<button
												onclick={createEditHandler(service)}
												class="text-sm font-medium text-blue-600 hover:text-blue-900"
											>
												Edit
											</button>
											<button
												onclick={createDeleteHandler(service.id)}
												class="text-sm font-medium text-red-600 hover:text-red-900"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Hidden delete forms for each service -->
{#each filteredServices as service}
	<form
		id="delete-form-{service.id}"
		method="POST"
		action="?/delete"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === "success") {
					// Success handled by $effect above
				} else if (result.type === "failure") {
					toast.error(result.data?.error || "Failed to delete service");
				}
				await update();
			};
		}}
		style="display: none;"
	>
		<input type="hidden" name="serviceId" value={service.id} />
	</form>
{/each}

<!-- Edit/Add Modal -->
{#if editingService}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">
					{editingService.id ? "Edit Service" : "Add Service"}
				</h3>
				<button
					type="button"
					onclick={cancelEdit}
					class="text-gray-400 transition-colors hover:text-gray-600"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="p-6">
				<form
					method="POST"
					action={editingService.id ? "?/update" : "?/create"}
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === "success") {
								editingService = null;
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					{#if editingService.id}
						<input type="hidden" name="serviceId" value={editingService.id} />
					{/if}

					<div>
						<label for="service-title" class="mb-2 block text-sm font-medium text-gray-700"
							>Title</label
						>
						<input
							id="service-title"
							name="title"
							type="text"
							bind:value={formTitle}
							placeholder="Web Development"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label for="service-price" class="mb-2 block text-sm font-medium text-gray-700"
							>Price</label
						>
						<input
							id="service-price"
							name="price"
							type="number"
							step="0.01"
							min="0"
							bind:value={formPrice}
							placeholder="500"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label for="service-category" class="mb-2 block text-sm font-medium text-gray-700"
							>Category</label
						>
						<input
							id="service-category"
							name="category"
							type="text"
							bind:value={formCategory}
							placeholder="Development"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="service-description" class="mb-2 block text-sm font-medium text-gray-700"
							>Description</label
						>
						<textarea
							id="service-description"
							name="description"
							bind:value={formDescription}
							placeholder="Describe your service..."
							rows="3"
							class="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						></textarea>
					</div>

					<div class="flex items-center">
						<input
							name="isActive"
							type="checkbox"
							id="active"
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							bind:checked={formIsActive}
						/>
						<label for="active" class="ml-2 text-sm text-gray-700">
							Active (visible on public profile)
						</label>
					</div>

					<div class="flex gap-3 pt-4">
						<Button type="submit" class="flex-1">
							{editingService.id ? "Update" : "Add"} Service
						</Button>
						<Button type="button" variant="outline" onclick={cancelEdit}>Cancel</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

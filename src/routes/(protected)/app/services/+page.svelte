<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { enhance } from "$app/forms";

	let { data, form } = $props();

	// Edit state
	let editingService = $state(null);

	const handleEdit = (service) => {
		editingService = service;
	};

	const cancelEdit = () => {
		editingService = null;
	};
</script>

<div class="p-6">
	<!-- Status Messages -->
	{#if form?.error}
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
			{#if form.action === "create"}
				Service created successfully!
			{:else if form.action === "update"}
				Service updated successfully!
			{:else if form.action === "delete"}
				Service deleted successfully!
			{:else}
				Action completed successfully!
			{/if}
		</div>
	{/if}

	<!-- Search and Add Button -->
	<div class="mb-6 flex items-center justify-between">
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
				placeholder="Search services..."
				class="w-80 rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<button
			onclick={() =>
				(editingService = {
					id: null,
					title: "",
					price: "",
					category: "",
					description: "",
					isActive: true,
				})}
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

	<!-- Services Table -->
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
		{#if data.services.length === 0}
			<div class="py-12 text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
				>
					<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">No services yet</h3>
				<p class="text-sm text-gray-500">Add your first service to get started</p>
			</div>
		{:else}
			<table class="w-full">
				<thead class="border-b border-gray-200 bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>Name</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>Category</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>Price</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>Status</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>Actions</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each data.services as service (service.id)}
						<tr class="hover:bg-gray-50">
							<td class="whitespace-nowrap px-6 py-4">
								<div class="text-sm font-medium text-gray-900">{service.title}</div>
								<div class="max-w-xs truncate text-sm text-gray-500">{service.description}</div>
							</td>
							<td class="whitespace-nowrap px-6 py-4">
								<div class="text-sm text-gray-900">{service.category || "Uncategorized"}</div>
							</td>
							<td class="whitespace-nowrap px-6 py-4">
								<div class="text-sm font-medium text-gray-900">{service.price}</div>
							</td>
							<td class="whitespace-nowrap px-6 py-4">
								{#if service.isActive}
									<span
										class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"
									>
										active
									</span>
								{:else}
									<span
										class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800"
									>
										inactive
									</span>
								{/if}
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
								<button
									onclick={() => handleEdit(service)}
									class="mr-4 text-blue-600 hover:text-blue-900"
								>
									Edit
								</button>
								<form method="POST" action="?/delete" use:enhance class="inline">
									<input type="hidden" name="serviceId" value={service.id} />
									<button
										type="submit"
										class="text-red-600 hover:text-red-900"
										onclick={(e) => {
											if (!confirm("Are you sure you want to delete this service?")) {
												e.preventDefault();
											}
										}}
									>
										Delete
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<!-- Edit/Add Modal -->
{#if editingService}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
			<div class="border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-medium text-gray-900">
					{editingService.id ? "Edit Service" : "Add Service"}
				</h3>
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
						<label class="mb-2 block text-sm font-medium text-gray-700">Title</label>
						<input
							name="title"
							type="text"
							bind:value={editingService.title}
							placeholder="Web Development"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">Price</label>
						<input
							name="price"
							type="text"
							bind:value={editingService.price}
							placeholder="$500"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">Category</label>
						<input
							name="category"
							type="text"
							bind:value={editingService.category}
							placeholder="Development"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">Description</label>
						<textarea
							name="description"
							bind:value={editingService.description}
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
							bind:checked={editingService.isActive}
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

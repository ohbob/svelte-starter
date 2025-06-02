<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import { FormField, FormTextarea, Card, LoadingSpinner } from "$lib/components/ui";

	let loading = $state(true);
	let saving = $state(false);

	// Services form data
	let services = $state([
		{
			title: "",
			short_description: "",
			long_description: "",
			duration_minutes: 60,
			price: "",
			target_audience: "",
		},
	]);

	onMount(async () => {
		await loadServices();
	});

	async function loadServices() {
		loading = true;
		try {
			const response = await fetch("/api/company/services");
			if (response.ok) {
				const data = await response.json();
				if (data.services && data.services.length > 0) {
					services = data.services;
				}
			}
		} catch (error) {
			console.error("Error loading services:", error);
			toast.error("Failed to load services");
		} finally {
			loading = false;
		}
	}

	async function saveServices() {
		saving = true;
		try {
			const response = await fetch("/api/company/services", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ services }),
			});

			if (response.ok) {
				toast.success("Services saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save services");
			}
		} catch (error) {
			console.error("Error saving services:", error);
			toast.error("Failed to save services");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveServices();
	}

	function addService() {
		services = [
			...services,
			{
				title: "",
				short_description: "",
				long_description: "",
				duration_minutes: 60,
				price: "",
				target_audience: "",
			},
		];
	}

	function removeService(index) {
		services = services.filter((_, i) => i !== index);
	}

	function handleRemoveService(index) {
		return () => removeService(index);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Services Offered</h2>
				<button type="button" onclick={addService} class="button-secondary"> Add Service </button>
			</div>

			{#each services as service, index}
				<Card title={service.title || `Service ${index + 1}`}>
					{#snippet children()}
						<div class="form-group">
							<div class="mb-4 flex items-start justify-between">
								<FormField
									label="Service Title"
									bind:value={service.title}
									placeholder="Service name"
									class="flex-1"
								/>
								{#if services.length > 1}
									<button
										type="button"
										onclick={handleRemoveService(index)}
										class="ml-4 rounded px-3 py-1 text-red-600 hover:text-red-800"
									>
										Remove
									</button>
								{/if}
							</div>

							<FormTextarea
								label="Short Description"
								bind:value={service.short_description}
								placeholder="Brief service description"
								rows={2}
							/>

							<FormTextarea
								label="Detailed Description"
								bind:value={service.long_description}
								placeholder="Comprehensive service details"
								rows={4}
							/>

							<div class="form-row">
								<FormField
									label="Duration (minutes)"
									type="number"
									bind:value={service.duration_minutes}
									placeholder="60"
								/>
								<FormField
									label="Price"
									bind:value={service.price}
									placeholder="$100 or Contact for pricing"
								/>
							</div>

							<FormField
								label="Target Audience"
								bind:value={service.target_audience}
								placeholder="Who is this service for?"
							/>
						</div>
					{/snippet}
				</Card>
			{/each}

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Services"}
				</button>
			</div>
		</form>
	{/if}
</div>

<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import {
		Button,
		FormField,
		FormTextarea,
		FormSelect,
		Card,
		LoadingSpinner,
		FormCheckbox,
	} from "$lib/components/ui";
	import { TIMEZONES } from "$lib/utils/form";

	let loading = $state(true);
	let saving = $state(false);

	// Locations form data
	let locations = $state([
		{
			label: "Main Office",
			address_line_1: "",
			address_line_2: "",
			city: "",
			zip_code: "",
			country: "United States",
			timezone: "America/New_York",
			google_maps_url: "",
			phone_number: "",
			email: "",
			whatsapp_or_sms_contact: "",
			is_main_location: true,
			accessibility_notes: "",
		},
	]);

	onMount(async () => {
		await loadLocations();
	});

	async function loadLocations() {
		loading = true;
		try {
			const response = await fetch("/api/company/locations");
			if (response.ok) {
				const data = await response.json();
				if (data.locations && data.locations.length > 0) {
					locations = data.locations;
				}
			}
		} catch (error) {
			console.error("Error loading locations:", error);
			toast.error("Failed to load locations");
		} finally {
			loading = false;
		}
	}

	async function saveLocations() {
		saving = true;
		try {
			const response = await fetch("/api/company/locations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ locations }),
			});

			if (response.ok) {
				toast.success("Locations saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save locations");
			}
		} catch (error) {
			console.error("Error saving locations:", error);
			toast.error("Failed to save locations");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveLocations();
	}

	function addLocation() {
		locations = [
			...locations,
			{
				label: `Location ${locations.length + 1}`,
				address_line_1: "",
				address_line_2: "",
				city: "",
				zip_code: "",
				country: "United States",
				timezone: "America/New_York",
				google_maps_url: "",
				phone_number: "",
				email: "",
				whatsapp_or_sms_contact: "",
				is_main_location: false,
				accessibility_notes: "",
			},
		];
	}

	function removeLocation(index) {
		locations = locations.filter((_, i) => i !== index);
	}

	function handleRemoveLocation(index) {
		return () => removeLocation(index);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Business Locations</h2>
				<button type="button" onclick={addLocation} class="button-secondary"> Add Location </button>
			</div>

			{#each locations as location, index}
				<Card title={location.label || `Location ${index + 1}`}>
					{#snippet children()}
						<div class="form-group">
							<div class="mb-4 flex items-start justify-between">
								<div class="form-row flex-1">
									<FormField
										label="Location Label"
										bind:value={location.label}
										placeholder="Main Office, Branch Location, etc."
									/>
									<div class="flex items-center">
										<FormCheckbox label="Main Location" bind:checked={location.is_main_location} />
									</div>
								</div>
								{#if locations.length > 1}
									<button
										type="button"
										onclick={handleRemoveLocation(index)}
										class="ml-4 rounded px-3 py-1 text-red-600 hover:text-red-800"
									>
										Remove
									</button>
								{/if}
							</div>

							<FormField
								label="Address Line 1"
								bind:value={location.address_line_1}
								placeholder="Street address"
							/>

							<FormField
								label="Address Line 2"
								bind:value={location.address_line_2}
								placeholder="Suite, unit, etc. (optional)"
							/>

							<div class="form-row">
								<FormField label="City" bind:value={location.city} placeholder="City" />
								<FormField label="ZIP Code" bind:value={location.zip_code} placeholder="12345" />
							</div>

							<div class="form-row">
								<FormField
									label="Country"
									bind:value={location.country}
									placeholder="United States"
								/>
								<FormSelect
									label="Timezone"
									bind:value={location.timezone}
									options={TIMEZONES.map((tz) => ({ value: tz, label: tz.replace("_", " ") }))}
								/>
							</div>

							<div class="form-row">
								<FormField
									label="Phone Number"
									type="tel"
									bind:value={location.phone_number}
									placeholder="(555) 123-4567"
								/>
								<FormField
									label="Email"
									type="email"
									bind:value={location.email}
									placeholder="location@business.com"
								/>
							</div>

							<FormField
								label="Google Maps URL"
								type="url"
								bind:value={location.google_maps_url}
								placeholder="https://maps.google.com/..."
							/>

							<FormTextarea
								label="Accessibility Notes"
								bind:value={location.accessibility_notes}
								placeholder="Wheelchair accessible, parking available, etc."
								rows={2}
							/>
						</div>
					{/snippet}
				</Card>
			{/each}

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Locations"}
				</button>
			</div>
		</form>
	{/if}
</div>

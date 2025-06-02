<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import { FormField, FormTextarea, FormSelect, Card, LoadingSpinner } from "$lib/components/ui";
	import { INDUSTRIES, LANGUAGES } from "$lib/utils/form";

	let loading = $state(true);
	let saving = $state(false);

	// Business Info form data
	let businessInfo = $state({
		business_name: "",
		tagline: "",
		description_short: "",
		description_full: "",
		year_established: new Date().getFullYear(),
		entity_type: "",
		industry: "",
		keywords: [],
		logo_url: "",
		brand_colors: ["#000000", "#ffffff"],
		languages_spoken: ["English"],
	});

	const entityTypes = [
		"Sole Proprietor",
		"LLC",
		"LLP",
		"Corporation",
		"Partnership",
		"Non-Profit",
		"Other",
	];

	onMount(async () => {
		await loadBusinessInfo();
	});

	async function loadBusinessInfo() {
		loading = true;
		try {
			const response = await fetch("/api/company/business-info");
			if (response.ok) {
				const data = await response.json();
				if (data.businessInfo) {
					businessInfo = { ...businessInfo, ...data.businessInfo };
				}
			}
		} catch (error) {
			console.error("Error loading business info:", error);
			toast.error("Failed to load business information");
		} finally {
			loading = false;
		}
	}

	async function saveBusinessInfo() {
		saving = true;
		try {
			const response = await fetch("/api/company/business-info", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(businessInfo),
			});

			if (response.ok) {
				toast.success("Business information saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save business information");
			}
		} catch (error) {
			console.error("Error saving business info:", error);
			toast.error("Failed to save business information");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveBusinessInfo();
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="two-column-layout">
				<div class="form-section">
					<Card title="Basic Information">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Business Name"
									bind:value={businessInfo.business_name}
									required
									placeholder="Your Business Name"
								/>

								<FormField
									label="Tagline"
									bind:value={businessInfo.tagline}
									placeholder="A memorable tagline"
								/>

								<FormTextarea
									label="Short Description"
									bind:value={businessInfo.description_short}
									placeholder="Brief description for search results and social media"
									rows={2}
								/>

								<FormTextarea
									label="Full Description"
									bind:value={businessInfo.description_full}
									placeholder="Detailed description of your business"
									rows={4}
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Business Details">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Year Established"
									type="number"
									bind:value={businessInfo.year_established}
									placeholder="2020"
								/>

								<FormSelect
									label="Entity Type"
									bind:value={businessInfo.entity_type}
									options={entityTypes}
									placeholder="Select entity type"
								/>

								<FormSelect
									label="Industry"
									bind:value={businessInfo.industry}
									options={INDUSTRIES}
									placeholder="Select industry"
								/>
							</div>
						{/snippet}
					</Card>
				</div>

				<div class="form-section">
					<Card title="Branding & Languages">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Logo URL"
									type="url"
									bind:value={businessInfo.logo_url}
									placeholder="https://example.com/logo.png"
								/>

								<div>
									<div class="label-base mb-1">Brand Colors</div>
									<div class="flex gap-2">
										<input
											type="color"
											bind:value={businessInfo.brand_colors[0]}
											class="h-10 w-20 rounded border"
											aria-label="Primary brand color"
										/>
										<input
											type="color"
											bind:value={businessInfo.brand_colors[1]}
											class="h-10 w-20 rounded border"
											aria-label="Secondary brand color"
										/>
									</div>
								</div>

								<div>
									<label class="label-base">Languages Spoken</label>
									<select
										multiple
										bind:value={businessInfo.languages_spoken}
										class="input-base h-24"
									>
										{#each LANGUAGES as language}
											<option value={language}>{language}</option>
										{/each}
									</select>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>
			</div>

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Business Information"}
				</button>
			</div>
		</form>
	{/if}
</div>

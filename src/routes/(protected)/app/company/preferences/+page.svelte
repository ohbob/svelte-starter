<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import {
		FormField,
		FormTextarea,
		FormSelect,
		Card,
		LoadingSpinner,
		FormCheckbox,
	} from "$lib/components/ui";

	let loading = $state(true);
	let saving = $state(false);

	// Preferences form data
	let preferences = $state({
		design_style: "",
		color_scheme: "",
		font_preferences: "",
		layout_style: "",
		accessibility_requirements: [],
		target_audience_age: "",
		target_audience_demographics: "",
		brand_personality: [],
		design_inspiration_urls: [],
		special_requirements: "",
		budget_range: "",
		timeline: "",
		additional_notes: "",
	});

	const designStyles = [
		"Modern & Minimalist",
		"Classic & Traditional",
		"Bold & Creative",
		"Professional & Corporate",
		"Warm & Friendly",
		"Elegant & Sophisticated",
		"Fun & Playful",
		"Industrial & Edgy",
	];

	const colorSchemes = [
		"Neutral (whites, grays, blacks)",
		"Earth tones (browns, greens, beiges)",
		"Cool colors (blues, purples, teals)",
		"Warm colors (reds, oranges, yellows)",
		"Monochromatic",
		"High contrast",
		"Pastel colors",
		"Brand colors only",
	];

	const layoutStyles = [
		"Single page/One page",
		"Multi-page traditional",
		"Grid-based layout",
		"Magazine style",
		"Portfolio style",
		"E-commerce focused",
		"Blog-centric",
		"Landing page focused",
	];

	const accessibilityOptions = [
		"WCAG 2.1 AA compliance",
		"Screen reader compatibility",
		"High contrast options",
		"Large text options",
		"Keyboard navigation",
		"Alt text for images",
		"Closed captions for videos",
		"Simple navigation",
	];

	const brandPersonalities = [
		"Professional",
		"Friendly",
		"Innovative",
		"Trustworthy",
		"Creative",
		"Reliable",
		"Approachable",
		"Expert",
		"Caring",
		"Dynamic",
	];

	const budgetRanges = [
		"Under $1,000",
		"$1,000 - $2,500",
		"$2,500 - $5,000",
		"$5,000 - $10,000",
		"$10,000 - $25,000",
		"$25,000+",
		"To be discussed",
	];

	const timelines = [
		"ASAP (Rush job)",
		"1-2 weeks",
		"3-4 weeks",
		"1-2 months",
		"3-6 months",
		"6+ months",
		"Flexible timeline",
	];

	onMount(async () => {
		await loadPreferences();
	});

	async function loadPreferences() {
		loading = true;
		try {
			const response = await fetch("/api/company/preferences");
			if (response.ok) {
				const data = await response.json();
				if (data.preferences) {
					preferences = { ...preferences, ...data.preferences };
				}
			}
		} catch (error) {
			console.error("Error loading preferences:", error);
			toast.error("Failed to load preferences");
		} finally {
			loading = false;
		}
	}

	async function savePreferences() {
		saving = true;
		try {
			const response = await fetch("/api/company/preferences", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(preferences),
			});

			if (response.ok) {
				toast.success("Preferences saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save preferences");
			}
		} catch (error) {
			console.error("Error saving preferences:", error);
			toast.error("Failed to save preferences");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		savePreferences();
	}

	function toggleAccessibility(requirement) {
		if (preferences.accessibility_requirements.includes(requirement)) {
			preferences.accessibility_requirements = preferences.accessibility_requirements.filter(
				(r) => r !== requirement
			);
		} else {
			preferences.accessibility_requirements = [
				...preferences.accessibility_requirements,
				requirement,
			];
		}
	}

	function togglePersonality(personality) {
		if (preferences.brand_personality.includes(personality)) {
			preferences.brand_personality = preferences.brand_personality.filter(
				(p) => p !== personality
			);
		} else {
			preferences.brand_personality = [...preferences.brand_personality, personality];
		}
	}

	function addInspirationUrl() {
		preferences.design_inspiration_urls = [...preferences.design_inspiration_urls, ""];
	}

	function removeInspirationUrl(index) {
		preferences.design_inspiration_urls = preferences.design_inspiration_urls.filter(
			(_, i) => i !== index
		);
	}

	function updateInspirationUrl(index, value) {
		preferences.design_inspiration_urls[index] = value;
	}

	function handleToggleAccessibility(requirement) {
		return () => toggleAccessibility(requirement);
	}

	function handleTogglePersonality(personality) {
		return () => togglePersonality(personality);
	}

	function handleRemoveInspirationUrl(index) {
		return () => removeInspirationUrl(index);
	}

	function handleUpdateInspirationUrl(index) {
		return (e) => updateInspirationUrl(index, e.target.value);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="two-column-layout">
				<div class="form-section">
					<Card title="Design Preferences">
						{#snippet children()}
							<div class="form-group">
								<FormSelect
									label="Design Style"
									bind:value={preferences.design_style}
									options={designStyles}
									placeholder="Select design style"
								/>

								<FormSelect
									label="Color Scheme"
									bind:value={preferences.color_scheme}
									options={colorSchemes}
									placeholder="Select color preference"
								/>

								<FormField
									label="Font Preferences"
									bind:value={preferences.font_preferences}
									placeholder="Any specific font requests?"
								/>

								<FormSelect
									label="Layout Style"
									bind:value={preferences.layout_style}
									options={layoutStyles}
									placeholder="Select layout preference"
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Target Audience">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Target Age Range"
									bind:value={preferences.target_audience_age}
									placeholder="e.g., 25-45, Seniors, Young adults"
								/>

								<FormTextarea
									label="Target Demographics"
									bind:value={preferences.target_audience_demographics}
									placeholder="Describe your ideal customers"
									rows={3}
								/>
							</div>
						{/snippet}
					</Card>
				</div>

				<div class="form-section">
					<Card title="Project Details">
						{#snippet children()}
							<div class="form-group">
								<FormSelect
									label="Budget Range"
									bind:value={preferences.budget_range}
									options={budgetRanges}
									placeholder="Select budget range"
								/>

								<FormSelect
									label="Timeline"
									bind:value={preferences.timeline}
									options={timelines}
									placeholder="Select timeline"
								/>

								<FormTextarea
									label="Special Requirements"
									bind:value={preferences.special_requirements}
									placeholder="Any specific features or requirements?"
									rows={3}
								/>
							</div>
						{/snippet}
					</Card>
				</div>
			</div>

			<Card title="Accessibility Requirements">
				{#snippet children()}
					<div class="form-group">
						<div class="label-base mb-3">Select accessibility features needed:</div>
						<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
							{#each accessibilityOptions as requirement}
								<label class="flex cursor-pointer items-center space-x-2">
									<input
										type="checkbox"
										checked={preferences.accessibility_requirements.includes(requirement)}
										onchange={handleToggleAccessibility(requirement)}
										class="rounded border-gray-300"
									/>
									<span class="text-sm text-gray-700">{requirement}</span>
								</label>
							{/each}
						</div>
					</div>
				{/snippet}
			</Card>

			<Card title="Brand Personality">
				{#snippet children()}
					<div class="form-group">
						<div class="label-base mb-3">How would you describe your brand personality?</div>
						<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
							{#each brandPersonalities as personality}
								<label class="flex cursor-pointer items-center space-x-2">
									<input
										type="checkbox"
										checked={preferences.brand_personality.includes(personality)}
										onchange={handleTogglePersonality(personality)}
										class="rounded border-gray-300"
									/>
									<span class="text-sm text-gray-700">{personality}</span>
								</label>
							{/each}
						</div>
					</div>
				{/snippet}
			</Card>

			<Card title="Design Inspiration">
				{#snippet children()}
					<div class="form-group">
						<div class="mb-4 flex items-center justify-between">
							<div class="label-base">Inspiration URLs</div>
							<button type="button" onclick={addInspirationUrl} class="button-secondary">
								Add URL
							</button>
						</div>

						{#each preferences.design_inspiration_urls as url, index}
							<div class="mb-2 flex gap-2">
								<input
									type="url"
									value={url}
									oninput={handleUpdateInspirationUrl(index)}
									placeholder="https://example.com"
									class="input-base flex-1"
								/>
								<button
									type="button"
									onclick={handleRemoveInspirationUrl(index)}
									class="rounded px-3 py-1 text-red-600 hover:text-red-800"
								>
									Remove
								</button>
							</div>
						{/each}

						{#if preferences.design_inspiration_urls.length === 0}
							<p class="text-sm text-gray-500">No inspiration URLs added yet.</p>
						{/if}
					</div>
				{/snippet}
			</Card>

			<Card title="Additional Notes">
				{#snippet children()}
					<div class="form-group">
						<FormTextarea
							label="Additional Notes & Comments"
							bind:value={preferences.additional_notes}
							placeholder="Any other information that would be helpful for your website project"
							rows={4}
						/>
					</div>
				{/snippet}
			</Card>

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Preferences"}
				</button>
			</div>
		</form>
	{/if}
</div>

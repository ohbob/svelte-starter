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

	// Technical Setup form data
	let technicalSettings = $state({
		domain_name: "",
		hosting_provider: "",
		cms_platform: "",
		analytics_tracking: "",
		google_analytics_id: "",
		facebook_pixel_id: "",
		seo_tools: [],
		ssl_certificate: true,
		cdn_enabled: false,
		backup_frequency: "",
		maintenance_schedule: "",
		performance_monitoring: false,
		security_features: [],
		third_party_integrations: [],
	});

	const hostingProviders = [
		"WordPress.com",
		"Squarespace",
		"Wix",
		"Shopify",
		"GoDaddy",
		"Bluehost",
		"SiteGround",
		"AWS",
		"Google Cloud",
		"Netlify",
		"Vercel",
		"Custom/Self-hosted",
	];

	const cmsPlatforms = [
		"WordPress",
		"Squarespace",
		"Wix",
		"Shopify",
		"Webflow",
		"Ghost",
		"Drupal",
		"Joomla",
		"Custom Solution",
	];

	const backupFrequencies = ["Daily", "Weekly", "Monthly", "Real-time", "Manual only"];

	const seoToolOptions = [
		"Google Search Console",
		"Google Analytics",
		"SEMrush",
		"Ahrefs",
		"Moz",
		"Yoast SEO",
		"RankMath",
	];

	const securityFeatures = [
		"SSL Certificate",
		"Two-Factor Authentication",
		"Regular Security Scans",
		"Firewall Protection",
		"DDoS Protection",
		"Malware Scanning",
		"Regular Updates",
	];

	onMount(async () => {
		await loadTechnicalSettings();
	});

	async function loadTechnicalSettings() {
		loading = true;
		try {
			const response = await fetch("/api/company/technical");
			if (response.ok) {
				const data = await response.json();
				if (data.technicalSettings) {
					technicalSettings = { ...technicalSettings, ...data.technicalSettings };
				}
			}
		} catch (error) {
			console.error("Error loading technical settings:", error);
			toast.error("Failed to load technical settings");
		} finally {
			loading = false;
		}
	}

	async function saveTechnicalSettings() {
		saving = true;
		try {
			const response = await fetch("/api/company/technical", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(technicalSettings),
			});

			if (response.ok) {
				toast.success("Technical settings saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save technical settings");
			}
		} catch (error) {
			console.error("Error saving technical settings:", error);
			toast.error("Failed to save technical settings");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveTechnicalSettings();
	}

	function toggleSeoTool(tool) {
		if (technicalSettings.seo_tools.includes(tool)) {
			technicalSettings.seo_tools = technicalSettings.seo_tools.filter((t) => t !== tool);
		} else {
			technicalSettings.seo_tools = [...technicalSettings.seo_tools, tool];
		}
	}

	function toggleSecurityFeature(feature) {
		if (technicalSettings.security_features.includes(feature)) {
			technicalSettings.security_features = technicalSettings.security_features.filter(
				(f) => f !== feature
			);
		} else {
			technicalSettings.security_features = [...technicalSettings.security_features, feature];
		}
	}

	function addIntegration() {
		technicalSettings.third_party_integrations = [
			...technicalSettings.third_party_integrations,
			{
				name: "",
				purpose: "",
				api_key_required: false,
				setup_notes: "",
			},
		];
	}

	function removeIntegration(index) {
		technicalSettings.third_party_integrations = technicalSettings.third_party_integrations.filter(
			(_, i) => i !== index
		);
	}

	function handleToggleSeoTool(tool) {
		return () => toggleSeoTool(tool);
	}

	function handleToggleSecurityFeature(feature) {
		return () => toggleSecurityFeature(feature);
	}

	function handleRemoveIntegration(index) {
		return () => removeIntegration(index);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="two-column-layout">
				<div class="form-section">
					<Card title="Domain & Hosting">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Domain Name"
									bind:value={technicalSettings.domain_name}
									placeholder="yourbusiness.com"
								/>

								<FormSelect
									label="Hosting Provider"
									bind:value={technicalSettings.hosting_provider}
									options={hostingProviders}
									placeholder="Select hosting provider"
								/>

								<FormSelect
									label="CMS Platform"
									bind:value={technicalSettings.cms_platform}
									options={cmsPlatforms}
									placeholder="Select CMS platform"
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Analytics & Tracking">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Google Analytics ID"
									bind:value={technicalSettings.google_analytics_id}
									placeholder="GA4-XXXXXXXXXX"
								/>

								<FormField
									label="Facebook Pixel ID"
									bind:value={technicalSettings.facebook_pixel_id}
									placeholder="123456789012345"
								/>

								<FormCheckbox
									label="Enable performance monitoring"
									bind:checked={technicalSettings.performance_monitoring}
								/>
							</div>
						{/snippet}
					</Card>
				</div>

				<div class="form-section">
					<Card title="Backup & Maintenance">
						{#snippet children()}
							<div class="form-group">
								<FormSelect
									label="Backup Frequency"
									bind:value={technicalSettings.backup_frequency}
									options={backupFrequencies}
									placeholder="How often to backup"
								/>

								<FormTextarea
									label="Maintenance Schedule"
									bind:value={technicalSettings.maintenance_schedule}
									placeholder="When do you perform maintenance?"
									rows={2}
								/>

								<div class="space-y-3">
									<FormCheckbox
										label="SSL Certificate enabled"
										bind:checked={technicalSettings.ssl_certificate}
									/>

									<FormCheckbox
										label="CDN (Content Delivery Network) enabled"
										bind:checked={technicalSettings.cdn_enabled}
									/>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>
			</div>

			<Card title="SEO Tools">
				{#snippet children()}
					<div class="form-group">
						<div class="label-base mb-3">Select SEO tools you use:</div>
						<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
							{#each seoToolOptions as tool}
								<label class="flex cursor-pointer items-center space-x-2">
									<input
										type="checkbox"
										checked={technicalSettings.seo_tools.includes(tool)}
										onchange={handleToggleSeoTool(tool)}
										class="rounded border-gray-300"
									/>
									<span class="text-sm text-gray-700">{tool}</span>
								</label>
							{/each}
						</div>
					</div>
				{/snippet}
			</Card>

			<Card title="Security Features">
				{#snippet children()}
					<div class="form-group">
						<div class="label-base mb-3">Select security features you have:</div>
						<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
							{#each securityFeatures as feature}
								<label class="flex cursor-pointer items-center space-x-2">
									<input
										type="checkbox"
										checked={technicalSettings.security_features.includes(feature)}
										onchange={handleToggleSecurityFeature(feature)}
										class="rounded border-gray-300"
									/>
									<span class="text-sm text-gray-700">{feature}</span>
								</label>
							{/each}
						</div>
					</div>
				{/snippet}
			</Card>

			<Card title="Third-Party Integrations">
				{#snippet children()}
					<div class="form-group">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-medium text-gray-900">External Integrations</h3>
							<button type="button" onclick={addIntegration} class="button-secondary">
								Add Integration
							</button>
						</div>

						{#each technicalSettings.third_party_integrations as integration, index}
							<div class="mb-4 rounded-lg border p-4">
								<div class="mb-4 flex items-start justify-between">
									<FormField
										label="Integration Name"
										bind:value={integration.name}
										placeholder="Service name"
										class="flex-1"
									/>
									{#if technicalSettings.third_party_integrations.length > 1}
										<button
											type="button"
											onclick={handleRemoveIntegration(index)}
											class="ml-4 rounded px-3 py-1 text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									{/if}
								</div>

								<FormField
									label="Purpose"
									bind:value={integration.purpose}
									placeholder="What does this integration do?"
								/>

								<FormCheckbox
									label="API key required"
									bind:checked={integration.api_key_required}
								/>

								<FormTextarea
									label="Setup Notes"
									bind:value={integration.setup_notes}
									placeholder="Any special setup requirements"
									rows={2}
								/>
							</div>
						{/each}
					</div>
				{/snippet}
			</Card>

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Technical Settings"}
				</button>
			</div>
		</form>
	{/if}
</div>

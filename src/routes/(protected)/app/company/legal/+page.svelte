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

	// Legal & Compliance form data
	let legalSettings = $state({
		privacy_policy_url: "",
		terms_of_service_url: "",
		cookie_policy_url: "",
		gdpr_compliance: false,
		ccpa_compliance: false,
		hipaa_compliance: false,
		business_license: "",
		insurance_info: "",
		certifications: [],
		disclaimers: "",
		liability_limitations: "",
		refund_policy: "",
		data_retention_policy: "",
	});

	const complianceStandards = [
		"GDPR (General Data Protection Regulation)",
		"CCPA (California Consumer Privacy Act)",
		"HIPAA (Health Insurance Portability)",
		"SOX (Sarbanes-Oxley Act)",
		"PCI DSS (Payment Card Industry)",
		"ADA (Americans with Disabilities Act)",
		"COPPA (Children's Online Privacy)",
		"CAN-SPAM Act",
	];

	onMount(async () => {
		await loadLegalSettings();
	});

	async function loadLegalSettings() {
		loading = true;
		try {
			const response = await fetch("/api/company/legal");
			if (response.ok) {
				const data = await response.json();
				if (data.legalSettings) {
					legalSettings = { ...legalSettings, ...data.legalSettings };
				}
			}
		} catch (error) {
			console.error("Error loading legal settings:", error);
			toast.error("Failed to load legal settings");
		} finally {
			loading = false;
		}
	}

	async function saveLegalSettings() {
		saving = true;
		try {
			const response = await fetch("/api/company/legal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(legalSettings),
			});

			if (response.ok) {
				toast.success("Legal settings saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save legal settings");
			}
		} catch (error) {
			console.error("Error saving legal settings:", error);
			toast.error("Failed to save legal settings");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveLegalSettings();
	}

	function addCertification() {
		legalSettings.certifications = [
			...legalSettings.certifications,
			{
				name: "",
				issuer: "",
				date_issued: "",
				expiry_date: "",
				certificate_url: "",
			},
		];
	}

	function removeCertification(index) {
		legalSettings.certifications = legalSettings.certifications.filter((_, i) => i !== index);
	}

	function handleRemoveCertification(index) {
		return () => removeCertification(index);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="two-column-layout">
				<div class="form-section">
					<Card title="Legal Documents">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Privacy Policy URL"
									type="url"
									bind:value={legalSettings.privacy_policy_url}
									placeholder="https://yourbusiness.com/privacy"
								/>

								<FormField
									label="Terms of Service URL"
									type="url"
									bind:value={legalSettings.terms_of_service_url}
									placeholder="https://yourbusiness.com/terms"
								/>

								<FormField
									label="Cookie Policy URL"
									type="url"
									bind:value={legalSettings.cookie_policy_url}
									placeholder="https://yourbusiness.com/cookies"
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Compliance Requirements">
						{#snippet children()}
							<div class="form-group">
								<div class="space-y-3">
									<FormCheckbox
										label="GDPR Compliance Required"
										bind:checked={legalSettings.gdpr_compliance}
									/>

									<FormCheckbox
										label="CCPA Compliance Required"
										bind:checked={legalSettings.ccpa_compliance}
									/>

									<FormCheckbox
										label="HIPAA Compliance Required"
										bind:checked={legalSettings.hipaa_compliance}
									/>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>

				<div class="form-section">
					<Card title="Business Credentials">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Business License Number"
									bind:value={legalSettings.business_license}
									placeholder="License number or registration"
								/>

								<FormTextarea
									label="Insurance Information"
									bind:value={legalSettings.insurance_info}
									placeholder="Professional liability, general liability, etc."
									rows={3}
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Policies">
						{#snippet children()}
							<div class="form-group">
								<FormTextarea
									label="Refund Policy"
									bind:value={legalSettings.refund_policy}
									placeholder="Describe your refund and return policy"
									rows={3}
								/>

								<FormTextarea
									label="Data Retention Policy"
									bind:value={legalSettings.data_retention_policy}
									placeholder="How long do you retain customer data?"
									rows={2}
								/>
							</div>
						{/snippet}
					</Card>
				</div>
			</div>

			<Card title="Certifications & Credentials">
				{#snippet children()}
					<div class="form-group">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-medium text-gray-900">Professional Certifications</h3>
							<button type="button" onclick={addCertification} class="button-secondary">
								Add Certification
							</button>
						</div>

						{#each legalSettings.certifications as certification, index}
							<div class="mb-4 rounded-lg border p-4">
								<div class="mb-4 flex items-start justify-between">
									<FormField
										label="Certification Name"
										bind:value={certification.name}
										placeholder="Certification title"
										class="flex-1"
									/>
									{#if legalSettings.certifications.length > 1}
										<button
											type="button"
											onclick={handleRemoveCertification(index)}
											class="ml-4 rounded px-3 py-1 text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									{/if}
								</div>

								<div class="form-row">
									<FormField
										label="Issuing Organization"
										bind:value={certification.issuer}
										placeholder="Who issued this certification?"
									/>
									<FormField
										label="Certificate URL"
										type="url"
										bind:value={certification.certificate_url}
										placeholder="Link to certificate"
									/>
								</div>

								<div class="form-row">
									<FormField
										label="Date Issued"
										type="date"
										bind:value={certification.date_issued}
									/>
									<FormField
										label="Expiry Date"
										type="date"
										bind:value={certification.expiry_date}
									/>
								</div>
							</div>
						{/each}
					</div>
				{/snippet}
			</Card>

			<div class="two-column-layout">
				<Card title="Disclaimers">
					{#snippet children()}
						<div class="form-group">
							<FormTextarea
								label="General Disclaimers"
								bind:value={legalSettings.disclaimers}
								placeholder="Any disclaimers about your services"
								rows={4}
							/>
						</div>
					{/snippet}
				</Card>

				<Card title="Liability Limitations">
					{#snippet children()}
						<div class="form-group">
							<FormTextarea
								label="Liability Limitations"
								bind:value={legalSettings.liability_limitations}
								placeholder="Limitations on your liability"
								rows={4}
							/>
						</div>
					{/snippet}
				</Card>
			</div>

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Legal Settings"}
				</button>
			</div>
		</form>
	{/if}
</div>

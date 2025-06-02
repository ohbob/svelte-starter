<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import { FormField, FormTextarea, Card, LoadingSpinner, FormCheckbox } from "$lib/components/ui";

	let loading = $state(true);
	let saving = $state(false);

	// Social & Online Presence form data
	let socialPresence = $state({
		social_profiles: {
			facebook: "",
			instagram: "",
			twitter: "",
			linkedin: "",
			youtube: "",
			tiktok: "",
			pinterest: "",
			snapchat: "",
		},
		directory_listings: {
			google_business: "",
			yelp: "",
			better_business_bureau: "",
			angie_list: "",
			thumbtack: "",
			nextdoor: "",
		},
		review_platforms: {
			google_reviews: true,
			yelp_reviews: true,
			facebook_reviews: true,
			custom_reviews: false,
		},
		social_media_strategy: "",
		posting_frequency: "",
		content_themes: [],
		hashtags: "",
		social_media_goals: "",
	});

	const postingFrequencies = [
		"Daily",
		"3-4 times per week",
		"2-3 times per week",
		"Weekly",
		"Bi-weekly",
		"Monthly",
		"As needed",
	];

	const contentThemeOptions = [
		"Behind the scenes",
		"Client testimonials",
		"Educational content",
		"Industry news",
		"Company culture",
		"Product/service highlights",
		"Community involvement",
		"Tips and advice",
		"Before/after showcases",
		"Team spotlights",
	];

	onMount(async () => {
		await loadSocialPresence();
	});

	async function loadSocialPresence() {
		loading = true;
		try {
			const response = await fetch("/api/company/social");
			if (response.ok) {
				const data = await response.json();
				if (data.socialPresence) {
					socialPresence = { ...socialPresence, ...data.socialPresence };
				}
			}
		} catch (error) {
			console.error("Error loading social presence:", error);
			toast.error("Failed to load social presence data");
		} finally {
			loading = false;
		}
	}

	async function saveSocialPresence() {
		saving = true;
		try {
			const response = await fetch("/api/company/social", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(socialPresence),
			});

			if (response.ok) {
				toast.success("Social presence saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save social presence");
			}
		} catch (error) {
			console.error("Error saving social presence:", error);
			toast.error("Failed to save social presence");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveSocialPresence();
	}

	function toggleContentTheme(theme) {
		if (socialPresence.content_themes.includes(theme)) {
			socialPresence.content_themes = socialPresence.content_themes.filter((t) => t !== theme);
		} else {
			socialPresence.content_themes = [...socialPresence.content_themes, theme];
		}
	}

	function handleToggleContentTheme(theme) {
		return () => toggleContentTheme(theme);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="two-column-layout">
				<div class="form-section">
					<Card title="Social Media Profiles">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Facebook"
									type="url"
									bind:value={socialPresence.social_profiles.facebook}
									placeholder="https://facebook.com/yourbusiness"
								/>

								<FormField
									label="Instagram"
									type="url"
									bind:value={socialPresence.social_profiles.instagram}
									placeholder="https://instagram.com/yourbusiness"
								/>

								<FormField
									label="Twitter/X"
									type="url"
									bind:value={socialPresence.social_profiles.twitter}
									placeholder="https://twitter.com/yourbusiness"
								/>

								<FormField
									label="LinkedIn"
									type="url"
									bind:value={socialPresence.social_profiles.linkedin}
									placeholder="https://linkedin.com/company/yourbusiness"
								/>

								<FormField
									label="YouTube"
									type="url"
									bind:value={socialPresence.social_profiles.youtube}
									placeholder="https://youtube.com/@yourbusiness"
								/>

								<FormField
									label="TikTok"
									type="url"
									bind:value={socialPresence.social_profiles.tiktok}
									placeholder="https://tiktok.com/@yourbusiness"
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Directory Listings">
						{#snippet children()}
							<div class="form-group">
								<FormField
									label="Google Business Profile"
									type="url"
									bind:value={socialPresence.directory_listings.google_business}
									placeholder="https://business.google.com/..."
								/>

								<FormField
									label="Yelp"
									type="url"
									bind:value={socialPresence.directory_listings.yelp}
									placeholder="https://yelp.com/biz/..."
								/>

								<FormField
									label="Better Business Bureau"
									type="url"
									bind:value={socialPresence.directory_listings.better_business_bureau}
									placeholder="https://bbb.org/..."
								/>

								<FormField
									label="Angie's List"
									type="url"
									bind:value={socialPresence.directory_listings.angie_list}
									placeholder="https://angieslist.com/..."
								/>

								<FormField
									label="Thumbtack"
									type="url"
									bind:value={socialPresence.directory_listings.thumbtack}
									placeholder="https://thumbtack.com/..."
								/>

								<FormField
									label="Nextdoor"
									type="url"
									bind:value={socialPresence.directory_listings.nextdoor}
									placeholder="https://nextdoor.com/..."
								/>
							</div>
						{/snippet}
					</Card>
				</div>

				<div class="form-section">
					<Card title="Review Platforms">
						{#snippet children()}
							<div class="form-group">
								<div class="space-y-3">
									<FormCheckbox
										label="Google Reviews"
										bind:checked={socialPresence.review_platforms.google_reviews}
									/>

									<FormCheckbox
										label="Yelp Reviews"
										bind:checked={socialPresence.review_platforms.yelp_reviews}
									/>

									<FormCheckbox
										label="Facebook Reviews"
										bind:checked={socialPresence.review_platforms.facebook_reviews}
									/>

									<FormCheckbox
										label="Custom Review System"
										bind:checked={socialPresence.review_platforms.custom_reviews}
									/>
								</div>
							</div>
						{/snippet}
					</Card>

					<Card title="Social Media Strategy">
						{#snippet children()}
							<div class="form-group">
								<FormTextarea
									label="Social Media Goals"
									bind:value={socialPresence.social_media_goals}
									placeholder="What do you want to achieve with social media?"
									rows={3}
								/>

								<div>
									<label class="label-base">Posting Frequency</label>
									<select bind:value={socialPresence.posting_frequency} class="input-base">
										<option value="">Select frequency</option>
										{#each postingFrequencies as frequency}
											<option value={frequency}>{frequency}</option>
										{/each}
									</select>
								</div>

								<FormTextarea
									label="Hashtag Strategy"
									bind:value={socialPresence.hashtags}
									placeholder="List relevant hashtags for your business"
									rows={2}
								/>
							</div>
						{/snippet}
					</Card>
				</div>
			</div>

			<Card title="Content Themes">
				{#snippet children()}
					<div class="form-group">
						<div class="label-base mb-3">Select content themes for your social media:</div>
						<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
							{#each contentThemeOptions as theme}
								<label class="flex cursor-pointer items-center space-x-2">
									<input
										type="checkbox"
										checked={socialPresence.content_themes.includes(theme)}
										onchange={handleToggleContentTheme(theme)}
										class="rounded border-gray-300"
									/>
									<span class="text-sm text-gray-700">{theme}</span>
								</label>
							{/each}
						</div>
					</div>
				{/snippet}
			</Card>

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Social Presence"}
				</button>
			</div>
		</form>
	{/if}
</div>

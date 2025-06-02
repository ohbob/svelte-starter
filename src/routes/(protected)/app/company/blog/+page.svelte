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

	// Blog settings form data
	let blogSettings = $state({
		blog_enabled: false,
		blog_title: "",
		blog_description: "",
		posting_frequency: "",
		content_categories: [],
		author_bio: "",
		seo_keywords: "",
		social_sharing: true,
		comments_enabled: false,
		newsletter_signup: false,
	});

	const postingFrequencies = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed"];

	const contentCategories = [
		"Industry News",
		"How-to Guides",
		"Case Studies",
		"Company Updates",
		"Tips & Advice",
		"Behind the Scenes",
		"Client Spotlights",
		"Product Updates",
		"Educational Content",
		"Thought Leadership",
	];

	onMount(async () => {
		await loadBlogSettings();
	});

	async function loadBlogSettings() {
		loading = true;
		try {
			const response = await fetch("/api/company/blog");
			if (response.ok) {
				const data = await response.json();
				if (data.blogSettings) {
					blogSettings = { ...blogSettings, ...data.blogSettings };
				}
			}
		} catch (error) {
			console.error("Error loading blog settings:", error);
			toast.error("Failed to load blog settings");
		} finally {
			loading = false;
		}
	}

	async function saveBlogSettings() {
		saving = true;
		try {
			const response = await fetch("/api/company/blog", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(blogSettings),
			});

			if (response.ok) {
				toast.success("Blog settings saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save blog settings");
			}
		} catch (error) {
			console.error("Error saving blog settings:", error);
			toast.error("Failed to save blog settings");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveBlogSettings();
	}

	function toggleCategory(category) {
		if (blogSettings.content_categories.includes(category)) {
			blogSettings.content_categories = blogSettings.content_categories.filter(
				(c) => c !== category
			);
		} else {
			blogSettings.content_categories = [...blogSettings.content_categories, category];
		}
	}

	function handleToggleCategory(category) {
		return () => toggleCategory(category);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<Card title="Blog Configuration">
				{#snippet children()}
					<div class="form-group">
						<FormCheckbox label="Enable blog on website" bind:checked={blogSettings.blog_enabled} />

						{#if blogSettings.blog_enabled}
							<FormField
								label="Blog Title"
								bind:value={blogSettings.blog_title}
								placeholder="Our Blog, News & Updates, etc."
							/>

							<FormTextarea
								label="Blog Description"
								bind:value={blogSettings.blog_description}
								placeholder="Brief description of what visitors can expect from your blog"
								rows={2}
							/>

							<FormSelect
								label="Posting Frequency"
								bind:value={blogSettings.posting_frequency}
								options={postingFrequencies}
								placeholder="How often will you post?"
							/>
						{/if}
					</div>
				{/snippet}
			</Card>

			{#if blogSettings.blog_enabled}
				<Card title="Content Categories">
					{#snippet children()}
						<div class="form-group">
							<div class="label-base mb-3">Select content categories for your blog:</div>
							<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
								{#each contentCategories as category}
									<label class="flex cursor-pointer items-center space-x-2">
										<input
											type="checkbox"
											checked={blogSettings.content_categories.includes(category)}
											onchange={handleToggleCategory(category)}
											class="rounded border-gray-300"
										/>
										<span class="text-sm text-gray-700">{category}</span>
									</label>
								{/each}
							</div>
						</div>
					{/snippet}
				</Card>

				<div class="two-column-layout">
					<Card title="Author Information">
						{#snippet children()}
							<div class="form-group">
								<FormTextarea
									label="Author Bio"
									bind:value={blogSettings.author_bio}
									placeholder="Brief bio about the blog author(s)"
									rows={3}
								/>
							</div>
						{/snippet}
					</Card>

					<Card title="Blog Features">
						{#snippet children()}
							<div class="form-group">
								<div class="space-y-3">
									<FormCheckbox
										label="Enable social sharing buttons"
										bind:checked={blogSettings.social_sharing}
									/>

									<FormCheckbox
										label="Enable comments"
										bind:checked={blogSettings.comments_enabled}
									/>

									<FormCheckbox
										label="Include newsletter signup"
										bind:checked={blogSettings.newsletter_signup}
									/>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>

				<Card title="SEO & Keywords">
					{#snippet children()}
						<div class="form-group">
							<FormTextarea
								label="SEO Keywords"
								bind:value={blogSettings.seo_keywords}
								placeholder="List relevant keywords for your blog content"
								rows={2}
							/>
						</div>
					{/snippet}
				</Card>
			{/if}

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Blog Settings"}
				</button>
			</div>
		</form>
	{/if}
</div>
